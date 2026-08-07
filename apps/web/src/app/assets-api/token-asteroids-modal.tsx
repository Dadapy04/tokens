'use client';

import Matter from 'matter-js';
import { GeistPixelSquare } from 'geist/font/pixel';
import { RotateCcw, X } from 'lucide-react';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTokenLogoURLWithSecondarySymbol } from '@/lib/logo-overrides';

type GameStatus =
    | 'loading'
    | 'ready'
    | 'playing'
    | 'level-cleared'
    | 'game-over'
    | 'error';

interface TargetLogo {
    assetId: string;
    symbol: string;
    name: string;
    logoUrl: string | null;
    image: HTMLImageElement | null;
}

interface StaticTarget {
    assetId: string;
    symbol: string;
    name: string;
    fallbackLogoUrl?: string;
}

interface TokenAsteroidsGameProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface HudState {
    score: number;
    lives: number;
    wave: number;
}

interface Viewport {
    width: number;
    height: number;
}

interface TargetEntity {
    body: Matter.Body;
    logo: TargetLogo;
    size: TargetSize;
    radius: number;
}

interface BulletEntity {
    body: Matter.Body;
    bornAt: number;
}

interface PowerUpEntity {
    body: Matter.Body;
    bornAt: number;
    kind: PowerUpKind;
    pairId: string | null;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

interface Star {
    x: number;
    y: number;
    r: number;
    alpha: number;
}

type TargetSize = 'large' | 'medium' | 'small';
type PowerUpKind = 'heart' | 'gun';

const STARTING_LIVES = 3;
const HIGH_SCORE_STORAGE_KEY = 'tokens-asteroids-high-score';
const BULLET_TTL_MS = 1200;
const POWER_UP_TTL_MS = 7000;
const SHOT_COOLDOWN_MS = 170;
const INVULNERABLE_MS = 1400;
const MAX_GUN_LEVEL = 4;
const TARGET_SCORE: Record<TargetSize, number> = {
    large: 20,
    medium: 50,
    small: 100,
};
const TARGET_RADIUS: Record<TargetSize, number> = {
    large: 25,
    medium: 18,
    small: 12,
};
const PIXEL_HEART_CELLS = [
    false, true, true, false, true, true, false,
    true, true, true, true, true, true, true,
    true, true, true, true, true, true, true,
    false, true, true, true, true, true, false,
    false, false, true, true, true, false, false,
    false, false, false, true, false, false, false,
];
const PIXEL_SCALE = 2;
const SHIP_DRAW_SCALE = 0.5;
const STATIC_TARGETS: StaticTarget[] = [
    { assetId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', fallbackLogoUrl: '/logos/popular/bitcoin.png' },
    { assetId: 'ethereum', symbol: 'ETH', name: 'Ethereum', fallbackLogoUrl: '/logos/popular/ethereum.png' },
    { assetId: 'tether', symbol: 'USDT', name: 'Tether', fallbackLogoUrl: '/logos/popular/tether.png' },
    { assetId: 'sui', symbol: 'SUI', name: 'Sui', fallbackLogoUrl: '/logos/currencies/sui.png' },
    { assetId: 'usd-coin', symbol: 'USDC', name: 'USD Coin', fallbackLogoUrl: '/logos/tokens/usdc.png' },
    { assetId: 'paypal-usd', symbol: 'PYUSD', name: 'PayPal USD', fallbackLogoUrl: '/logos/tokens/pyusd.png' },
    { assetId: 'tesla', symbol: 'TSLAx', name: 'Tesla xStock', fallbackLogoUrl: '/logos/xstocks/TSLAx.png' },
    { assetId: 'nvidia', symbol: 'NVDAx', name: 'NVIDIA xStock', fallbackLogoUrl: '/logos/xstocks/NVDAx.png' },
    { assetId: 'apple', symbol: 'AAPLx', name: 'Apple xStock' },
    { assetId: 'microsoft', symbol: 'MSFTx', name: 'Microsoft xStock' },
    { assetId: 'amazon', symbol: 'AMZNx', name: 'Amazon xStock' },
    { assetId: 'meta', symbol: 'METAx', name: 'Meta xStock' },
    { assetId: 'alphabet', symbol: 'GOOGLx', name: 'Alphabet xStock' },
    { assetId: 'amd', symbol: 'AMDx', name: 'AMD xStock' },
    { assetId: 'coinbase', symbol: 'COINx', name: 'Coinbase xStock' },
    { assetId: 'hood', symbol: 'HOODx', name: 'Robinhood xStock' },
    { assetId: 'circle', symbol: 'CRCLx', name: 'Circle xStock' },
    { assetId: 'strategy', symbol: 'MSTRx', name: 'Strategy xStock' },
    { assetId: 'spy', symbol: 'SPYx', name: 'SPY xStock' },
    { assetId: 'qqq', symbol: 'QQQx', name: 'QQQ xStock' },
    { assetId: 'openai', symbol: 'openai', name: 'OpenAI Prestock' },
    { assetId: 'spacex', symbol: 'spacex', name: 'SpaceX Prestock' },
    { assetId: 'anthropic', symbol: 'anthropic', name: 'Anthropic Prestock' },
    { assetId: 'anduril', symbol: 'anduril', name: 'Anduril Prestock' },
    { assetId: 'kalshi', symbol: 'kalshi', name: 'Kalshi Prestock' },
    { assetId: 'polymarket', symbol: 'polymarket', name: 'Polymarket Prestock' },
];
const CONTROL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Spacebar', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D']);

function tokenColor(symbol: string): string {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
    const hue = hash % 360;
    return `hsl(${hue} 74% 55%)`;
}

function snap(value: number): number {
    return Math.round(value);
}

function fillPixelCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, step = 4) {
    const r = snap(radius);
    const cx = snap(x);
    const cy = snap(y);
    for (let yy = -r; yy <= r; yy += step) {
        const half = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)) / step) * step;
        ctx.fillRect(cx - half, cy + yy, Math.max(step, half * 2), step);
    }
}

function fillPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.fillRect(snap(x), snap(y), snap(width), snap(height));
}

function addPixelCircleClip(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, step = 4) {
    const r = snap(radius);
    const cx = snap(x);
    const cy = snap(y);
    ctx.beginPath();
    for (let yy = -r; yy <= r; yy += step) {
        const half = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)) / step) * step;
        ctx.rect(cx - half, cy + yy, Math.max(step, half * 2), step);
    }
    ctx.clip();
}

function createStars(count: number): Star[] {
    return Array.from({ length: count }, (_, index) => {
        const n = index + 1;
        const x = ((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1;
        const y = ((Math.sin(n * 78.233) * 23454.421) % 1 + 1) % 1;
        const r = 0.7 + (((n * 17) % 10) / 20);
        const alpha = 0.22 + (((n * 29) % 30) / 100);
        return { x, y, r, alpha };
    });
}

// createStars is deterministic (pure index math), so the star field is a constant;
// building it once at module scope avoids re-allocating 80 stars on every render.
const STAR_FIELD = createStars(80);

async function loadImage(url: string | null): Promise<HTMLImageElement | null> {
    if (!url) return null;
    return await new Promise(resolve => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = url;
    });
}

async function hydrateTargets(targets: Array<Omit<TargetLogo, 'image'>>): Promise<TargetLogo[]> {
    const hydrated = await Promise.all(
        targets.map(async target => ({
            ...target,
            image: await loadImage(target.logoUrl),
        })),
    );
    return hydrated.length > 0 ? hydrated : STATIC_TARGETS.map(target => ({
        ...target,
        logoUrl: target.fallbackLogoUrl ?? null,
        image: null,
    }));
}

function shuffleTargets<T>(items: readonly T[]): T[] {
    const shuffled = items.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
}

function buildStaticTargetCandidates(): Array<Omit<TargetLogo, 'image'>> {
    return shuffleTargets(STATIC_TARGETS).map(target => ({
        assetId: target.assetId,
        symbol: target.symbol,
        name: target.name,
        logoUrl:
            getTokenLogoURLWithSecondarySymbol(target.symbol, target.name, target.fallbackLogoUrl) ??
            target.fallbackLogoUrl ??
            null,
    }));
}

function drawFallbackLogo(ctx: CanvasRenderingContext2D, logo: TargetLogo, x: number, y: number, radius: number, fontFamily: string) {
    ctx.save();
    ctx.fillStyle = tokenColor(logo.symbol);
    fillPixelCircle(ctx, x, y, radius * 0.68, 4);
    ctx.fillStyle = 'white';
    ctx.font = `500 ${Math.max(10, radius * 0.46)}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(logo.symbol.slice(0, 4).toUpperCase(), x, y);
    ctx.restore();
}

function drawPixelRocket(ctx: CanvasRenderingContext2D, thrusting: boolean, timestamp: number) {
    const block = (color: string, x: number, y: number, width: number, height: number) => {
        ctx.fillStyle = color;
        fillPixelRect(ctx, x, y, width, height);
    };

    block('#E0523E', -28, -24, 8, 12);
    block('#E0523E', -20, -28, 12, 16);
    block('#D84A3A', -8, -24, 8, 12);
    block('#C34235', -24, -16, 12, 12);
    block('#E0523E', -28, 12, 8, 12);
    block('#E0523E', -20, 12, 12, 16);
    block('#D84A3A', -8, 12, 8, 12);
    block('#C34235', -24, 4, 12, 12);

    block('#E4ECFA', -32, -12, 8, 24);
    block('#EEF4FE', -24, -16, 12, 32);
    block('#F8FBFF', -12, -18, 16, 36);
    block('#F8FBFF', 4, -16, 12, 32);
    block('#F8FBFF', 16, -14, 8, 28);
    block('#EEF4FE', 24, -10, 8, 20);
    block('#EEF4FE', 32, -6, 8, 12);
    block('#F8FBFF', 40, -2, 4, 4);
    block('#D8E5FB', 8, 12, 12, 6);
    block('#D8E5FB', 18, -14, 8, 6);
    block('#C8D9F4', 24, -6, 6, 6);
    block('#C8D9F4', 24, 2, 6, 6);
    block('#FFFFFF', -20, -14, 8, 8);
    block('#FFFFFF', -28, -8, 8, 16);

    block('#31C8C5', 8, -8, 12, 16);
    block('#28ACA9', 4, -4, 8, 12);
    block('#67E2DE', 12, -4, 8, 6);
    block('#CFFFFB', 16, -4, 4, 4);

    block('#D84A3A', -14, -4, 4, 4);
    block('#D84A3A', -14, 6, 4, 4);
    block('#3F3472', -40, -8, 10, 16);
    block('#453B80', -50, -5, 10, 10);
    block('#453B80', -30, -5, 8, 10);

    if (thrusting) {
        const flicker = Math.round(Math.sin(timestamp / 70) * 4);
        block('#FFB800', -58, -7, 12, 14);
        block('#FFE42D', -72 - flicker, -5, 18 + flicker, 10);
        block('#FFF680', -62, -2, 14, 4);
        block('#FF9A00', -76 - flicker, 7, 8, 8);
        block('#FFC400', -78 + flicker, -15, 6, 6);
    }
}

function PixelHeart({ filled, accent = 'red' }: { filled: boolean; accent?: 'red' | 'yellow' }) {
    const filledClass = accent === 'yellow' ? 'bg-[#f7d154]' : 'bg-[#ff3f55]';
    return (
        <span
            aria-hidden="true"
            className={`grid gap-px ${filled ? 'opacity-100' : 'opacity-30'}`}
            style={{ gridTemplateColumns: 'repeat(7, 2px)', gridTemplateRows: 'repeat(6, 2px)' }}
        >
            {PIXEL_HEART_CELLS.map((active, index) => (
                <span
                    key={index}
                    className={active ? filled ? filledClass : 'bg-white' : 'bg-transparent'}
                />
            ))}
        </span>
    );
}

function drawPixelHeartSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    fill = '#ff3f55',
    highlight = '#ff8b98',
) {
    const cell = Math.max(1, snap(scale));
    const startX = snap(x - (7 * cell) / 2);
    const startY = snap(y - (6 * cell) / 2);
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const index = row * 7 + col;
            if (!PIXEL_HEART_CELLS[index]) continue;
            ctx.fillStyle = row <= 1 && col <= 3 ? highlight : fill;
            ctx.fillRect(startX + col * cell, startY + row * cell, cell, cell);
        }
    }
}

function drawPixelGunUpgradeSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    fill = '#57e5c6',
    highlight = '#b2fff0',
) {
    const cell = Math.max(1, snap(scale));
    const startX = snap(x - (7 * cell) / 2);
    const startY = snap(y - (6 * cell) / 2);
    const cells = [
        false, false, true, false, true, false, false,
        false, true, true, true, true, true, false,
        true, true, true, true, true, true, true,
        false, false, true, true, true, false, false,
        false, true, true, false, true, true, false,
        true, true, false, false, false, true, true,
    ];
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const index = row * 7 + col;
            if (!cells[index]) continue;
            ctx.fillStyle = row <= 1 ? highlight : fill;
            ctx.fillRect(startX + col * cell, startY + row * cell, cell, cell);
        }
    }
}

function useAsteroidsRefs() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const gameRegionRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const collisionHandlerRef = useRef<((event: Matter.IEventCollision<Matter.Engine>) => void) | null>(null);
    const shipRef = useRef<Matter.Body | null>(null);
    const targetsRef = useRef<Map<number, TargetEntity>>(new Map());
    const bulletsRef = useRef<Map<number, BulletEntity>>(new Map());
    const powerUpsRef = useRef<Map<number, PowerUpEntity>>(new Map());
    const targetPoolRef = useRef<TargetLogo[]>([]);
    const keysRef = useRef<Set<string>>(new Set());
    const statusRef = useRef<GameStatus>('loading');
    const hudRef = useRef<HudState>({ score: 0, lives: STARTING_LIVES, wave: 1 });
    const viewportRef = useRef<Viewport>({ width: 800, height: 500 });
    const lastFrameMsRef = useRef<number>(0);
    const lastShotMsRef = useRef<number>(0);
    const highScoreRef = useRef(0);
    const gunLevelRef = useRef(1);
    const invulnerableUntilRef = useRef<number>(0);
    const transitionRef = useRef(false);
    const particlesRef = useRef<Particle[]>([]);
    const prefersReducedMotionRef = useRef(false);
    const starsRef = useRef<Star[]>(STAR_FIELD);

    return {
        bulletsRef,
        canvasRef,
        collisionHandlerRef,
        engineRef,
        frameRef,
        gameRegionRef,
        gunLevelRef,
        highScoreRef,
        hudRef,
        invulnerableUntilRef,
        keysRef,
        lastFrameMsRef,
        lastShotMsRef,
        particlesRef,
        powerUpsRef,
        prefersReducedMotionRef,
        shipRef,
        starsRef,
        statusRef,
        targetPoolRef,
        targetsRef,
        transitionRef,
        viewportRef,
        wrapRef,
    };
}

type AsteroidsRefs = ReturnType<typeof useAsteroidsRefs>;

function useAsteroidsWorld(refs: AsteroidsRefs) {
    const {
        bulletsRef,
        collisionHandlerRef,
        engineRef,
        frameRef,
        gunLevelRef,
        invulnerableUntilRef,
        keysRef,
        lastFrameMsRef,
        particlesRef,
        powerUpsRef,
        prefersReducedMotionRef,
        shipRef,
        targetPoolRef,
        targetsRef,
        transitionRef,
        viewportRef,
    } = refs;

    const cleanupWorld = useCallback((options: { cancelLoop?: boolean } = {}) => {
        const cancelLoop = options.cancelLoop ?? true;
        if (cancelLoop && frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        const engine = engineRef.current;
        if (engine) {
            if (collisionHandlerRef.current) {
                Matter.Events.off(engine, 'collisionStart', collisionHandlerRef.current);
            }
            Matter.World.clear(engine.world, false);
            Matter.Engine.clear(engine);
        }
        collisionHandlerRef.current = null;
        engineRef.current = null;
        shipRef.current = null;
        targetsRef.current.clear();
        bulletsRef.current.clear();
        powerUpsRef.current.clear();
        keysRef.current.clear();
        particlesRef.current = [];
        transitionRef.current = false;
        lastFrameMsRef.current = 0;
        gunLevelRef.current = 1;
    }, [bulletsRef, collisionHandlerRef, engineRef, frameRef, gunLevelRef, keysRef, lastFrameMsRef, particlesRef, powerUpsRef, shipRef, targetsRef, transitionRef]);

    const addParticles = useCallback((x: number, y: number, color: string, count: number) => {
        if (prefersReducedMotionRef.current) return;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
            const speed = 1.2 + Math.random() * 3.8;
            particlesRef.current.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 420 + Math.random() * 260,
                maxLife: 680,
                color,
                size: 1.5 + Math.random() * 2.5,
            });
        }
    }, [particlesRef, prefersReducedMotionRef]);

    const addBreakParticles = useCallback((target: TargetEntity) => {
        if (prefersReducedMotionRef.current) return;
        const { x, y } = target.body.position;
        const count = target.size === 'large' ? 34 : target.size === 'medium' ? 24 : 16;
        const colors = [tokenColor(target.logo.symbol), '#ffffff', '#d8e5fb'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const originRadius = Math.random() * target.radius * 0.65;
            const speed = 1.8 + Math.random() * (target.size === 'small' ? 3.2 : 4.8);
            particlesRef.current.push({
                x: x + Math.cos(angle) * originRadius,
                y: y + Math.sin(angle) * originRadius,
                vx: Math.cos(angle) * speed + target.body.velocity.x * 0.35,
                vy: Math.sin(angle) * speed + target.body.velocity.y * 0.35,
                life: 520 + Math.random() * 360,
                maxLife: 880,
                color: colors[i % colors.length]!,
                size: 2 + Math.random() * (target.size === 'large' ? 4 : 3),
            });
        }
    }, [particlesRef, prefersReducedMotionRef]);

    const wrapBody = useCallback((body: Matter.Body) => {
        const { width, height } = viewportRef.current;
        const margin = 44;
        let x = body.position.x;
        let y = body.position.y;
        if (x < -margin) x = width + margin;
        if (x > width + margin) x = -margin;
        if (y < -margin) y = height + margin;
        if (y > height + margin) y = -margin;
        if (x !== body.position.x || y !== body.position.y) Matter.Body.setPosition(body, { x, y });
    }, [viewportRef]);

    const removeBody = useCallback((body: Matter.Body) => {
        const engine = engineRef.current;
        if (!engine) return;
        Matter.World.remove(engine.world, body);
    }, [engineRef]);

    const createShip = useCallback(() => {
        const engine = engineRef.current;
        if (!engine) return null;
        const { width, height } = viewportRef.current;
        const ship = Matter.Bodies.polygon(width / 2, height / 2, 3, 17, {
            label: 'ship',
            frictionAir: 0.035,
            restitution: 0.9,
        });
        Matter.Body.setAngle(ship, -Math.PI / 2);
        Matter.World.add(engine.world, ship);
        shipRef.current = ship;
        invulnerableUntilRef.current = performance.now() + INVULNERABLE_MS;
        return ship;
    }, [engineRef, invulnerableUntilRef, shipRef, viewportRef]);

    const spawnTarget = useCallback((logo: TargetLogo, size: TargetSize, x: number, y: number, wave: number) => {
        const engine = engineRef.current;
        if (!engine) return;
        const radius = TARGET_RADIUS[size];
        const body = Matter.Bodies.circle(x, y, radius, {
            label: 'target',
            frictionAir: 0,
            restitution: 1,
        });
        const speedWave = Math.min(wave, 24);
        const speed = 0.7 + speedWave * 0.12 + (size === 'small' ? 0.65 : size === 'medium' ? 0.35 : 0);
        const angle = Math.atan2(viewportRef.current.height / 2 - y, viewportRef.current.width / 2 - x) + (Math.random() - 0.5) * 1.2;
        Matter.Body.setVelocity(body, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.035);
        targetsRef.current.set(body.id, { body, logo, size, radius });
        Matter.World.add(engine.world, body);
    }, [engineRef, targetsRef, viewportRef]);

    const spawnPowerUp = useCallback((kind: PowerUpKind, x: number, y: number, pairId: string | null, driftX = 0) => {
        const engine = engineRef.current;
        if (!engine) return;
        const body = Matter.Bodies.circle(x, y, 11, {
            label: `power-up-${kind}`,
            isSensor: true,
            frictionAir: 0.005,
            restitution: 1,
        });
        Matter.Body.setVelocity(body, {
            x: driftX + (Math.random() - 0.5) * 0.8,
            y: (Math.random() - 0.5) * 1.8,
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.025);
        powerUpsRef.current.set(body.id, { body, bornAt: performance.now(), kind, pairId });
        Matter.World.add(engine.world, body);
    }, [engineRef, powerUpsRef]);

    const spawnWaveRewardChoice = useCallback((x: number, y: number, wave: number) => {
        if (wave >= 3) {
            const pairId = `${wave}-${performance.now()}`;
            spawnPowerUp('heart', x - 16, y, pairId, -0.8);
            spawnPowerUp('gun', x + 16, y, pairId, 0.8);
            return;
        }
        spawnPowerUp('heart', x, y, null);
    }, [spawnPowerUp]);

    const spawnWave = useCallback((wave: number) => {
        const { width, height } = viewportRef.current;
        const pool = targetPoolRef.current.length > 0 ? targetPoolRef.current : buildStaticTargetCandidates().map(target => ({ ...target, image: null }));
        const targetCount = Math.min(3 + wave, 18);
        const waveLogos = shuffleTargets(pool).slice(0, targetCount);
        for (let i = 0; i < targetCount; i++) {
            const edge = i % 4;
            const pad = 42;
            const x = edge === 0 ? -pad : edge === 1 ? width + pad : Math.random() * width;
            const y = edge === 2 ? -pad : edge === 3 ? height + pad : Math.random() * height;
            const logo = waveLogos[i % waveLogos.length] ?? { assetId: 'tokens', symbol: 'TOK', name: 'Tokens', logoUrl: null, image: null };
            const startsSmaller = wave >= 6 && i % 5 === 0;
            spawnTarget(logo, startsSmaller ? 'medium' : 'large', x, y, wave);
        }
    }, [spawnTarget, targetPoolRef, viewportRef]);

    return {
        addBreakParticles,
        addParticles,
        cleanupWorld,
        createShip,
        removeBody,
        spawnTarget,
        spawnWave,
        spawnWaveRewardChoice,
        wrapBody,
    };
}

interface AsteroidsCollisionOptions {
    addBreakParticles: (target: TargetEntity) => void;
    addParticles: (x: number, y: number, color: string, count: number) => void;
    removeBody: (body: Matter.Body) => void;
    setGunLevel: Dispatch<SetStateAction<number>>;
    setStatus: Dispatch<SetStateAction<GameStatus>>;
    spawnTarget: (logo: TargetLogo, size: TargetSize, x: number, y: number, wave: number) => void;
    spawnWaveRewardChoice: (x: number, y: number, wave: number) => void;
    syncHud: (next: HudState) => void;
}

function useAsteroidsCollisions(refs: AsteroidsRefs, options: AsteroidsCollisionOptions) {
    const { bulletsRef, hudRef, invulnerableUntilRef, powerUpsRef, shipRef, statusRef, targetsRef, viewportRef } = refs;
    const { addBreakParticles, addParticles, removeBody, setGunLevel, setStatus, spawnTarget, spawnWaveRewardChoice, syncHud } = options;

    const resetShipAfterHit = useCallback(() => {
        const ship = shipRef.current;
        if (!ship) return;
        const { width, height } = viewportRef.current;
        Matter.Body.setPosition(ship, { x: width / 2, y: height / 2 });
        Matter.Body.setVelocity(ship, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(ship, 0);
        Matter.Body.setAngle(ship, -Math.PI / 2);
        invulnerableUntilRef.current = performance.now() + INVULNERABLE_MS;
    }, [invulnerableUntilRef, shipRef, viewportRef]);

    const removePairedPowerUps = useCallback((pairId: string | null, keepBodyId?: number) => {
        if (!pairId) return;
        for (const [id, powerUp] of powerUpsRef.current) {
            if (powerUp.pairId !== pairId || id === keepBodyId) continue;
            removeBody(powerUp.body);
            powerUpsRef.current.delete(id);
        }
    }, [powerUpsRef, removeBody]);

    const collectHeartPowerUp = useCallback((powerUp: PowerUpEntity) => {
        removeBody(powerUp.body);
        powerUpsRef.current.delete(powerUp.body.id);
        removePairedPowerUps(powerUp.pairId, powerUp.body.id);
        addParticles(powerUp.body.position.x, powerUp.body.position.y, '#ff6b7d', 18);
        const nextHud = {
            ...hudRef.current,
            lives: hudRef.current.lives + 1,
        };
        syncHud(nextHud);
    }, [addParticles, hudRef, powerUpsRef, removeBody, removePairedPowerUps, syncHud]);

    const collectGunPowerUp = useCallback((powerUp: PowerUpEntity) => {
        removeBody(powerUp.body);
        powerUpsRef.current.delete(powerUp.body.id);
        removePairedPowerUps(powerUp.pairId, powerUp.body.id);
        addParticles(powerUp.body.position.x, powerUp.body.position.y, '#57e5c6', 18);
        setGunLevel(current => Math.min(MAX_GUN_LEVEL, current + 1));
    }, [addParticles, powerUpsRef, removeBody, removePairedPowerUps, setGunLevel]);

    const destroyTarget = useCallback((target: TargetEntity, bullet: BulletEntity | null) => {
        const wasLastTarget = targetsRef.current.size === 1;
        removeBody(target.body);
        targetsRef.current.delete(target.body.id);
        if (bullet) {
            removeBody(bullet.body);
            bulletsRef.current.delete(bullet.body.id);
        }

        const nextHud = {
            ...hudRef.current,
            score: hudRef.current.score + TARGET_SCORE[target.size],
        };
        syncHud(nextHud);
        addBreakParticles(target);

        const nextSize: TargetSize | null = target.size === 'large' ? 'medium' : target.size === 'medium' ? 'small' : null;
        if (!nextSize) {
            if (wasLastTarget) spawnWaveRewardChoice(target.body.position.x, target.body.position.y, hudRef.current.wave);
            return;
        }

        const splitAngle = Math.random() * Math.PI * 2;
        const distance = target.radius * 0.8;
        spawnTarget(
            target.logo,
            nextSize,
            target.body.position.x + Math.cos(splitAngle) * distance,
            target.body.position.y + Math.sin(splitAngle) * distance,
            hudRef.current.wave,
        );
        spawnTarget(
            target.logo,
            nextSize,
            target.body.position.x - Math.cos(splitAngle) * distance,
            target.body.position.y - Math.sin(splitAngle) * distance,
            hudRef.current.wave,
        );
    }, [addBreakParticles, bulletsRef, hudRef, removeBody, spawnTarget, spawnWaveRewardChoice, syncHud, targetsRef]);

    const handleShipHit = useCallback((target: TargetEntity) => {
        const now = performance.now();
        if (now < invulnerableUntilRef.current) return;
        addParticles(shipRef.current?.position.x ?? target.body.position.x, shipRef.current?.position.y ?? target.body.position.y, '#ffffff', 18);
        setGunLevel(current => Math.max(1, current - 1));
        const nextLives = hudRef.current.lives - 1;
        const nextHud = { ...hudRef.current, lives: nextLives };
        syncHud(nextHud);
        if (nextLives <= 0) {
            setStatus('game-over');
            statusRef.current = 'game-over';
            return;
        }
        resetShipAfterHit();
    }, [addParticles, hudRef, invulnerableUntilRef, resetShipAfterHit, setGunLevel, setStatus, shipRef, statusRef, syncHud]);

    const onCollisionStart = useCallback((event: Matter.IEventCollision<Matter.Engine>) => {
        for (const pair of event.pairs) {
            const bodies = [pair.bodyA, pair.bodyB];
            const bulletBody = bodies.find(body => body.label === 'bullet') ?? null;
            const targetBody = bodies.find(body => body.label === 'target') ?? null;
            const shipBody = bodies.find(body => body.label === 'ship') ?? null;
            const powerUpBody = bodies.find(body => body.label.startsWith('power-up-')) ?? null;

            if (bulletBody && targetBody) {
                const bullet = bulletsRef.current.get(bulletBody.id);
                const target = targetsRef.current.get(targetBody.id);
                if (bullet && target) destroyTarget(target, bullet);
                continue;
            }

            if (shipBody && powerUpBody) {
                const powerUp = powerUpsRef.current.get(powerUpBody.id);
                if (powerUp?.kind === 'heart') collectHeartPowerUp(powerUp);
                if (powerUp?.kind === 'gun') collectGunPowerUp(powerUp);
                continue;
            }

            if (shipBody && targetBody) {
                const target = targetsRef.current.get(targetBody.id);
                if (target) handleShipHit(target);
            }
        }
    }, [bulletsRef, collectGunPowerUp, collectHeartPowerUp, destroyTarget, handleShipHit, powerUpsRef, targetsRef]);

    return { onCollisionStart };
}

interface AsteroidsLoopOptions {
    removeBody: (body: Matter.Body) => void;
    setCanvasSize: Dispatch<SetStateAction<Viewport>>;
    setStatus: Dispatch<SetStateAction<GameStatus>>;
    spawnWave: (wave: number) => void;
    syncHud: (next: HudState) => void;
    wrapBody: (body: Matter.Body) => void;
}

function useAsteroidsLoop(refs: AsteroidsRefs, options: AsteroidsLoopOptions) {
    const {
        bulletsRef,
        canvasRef,
        engineRef,
        frameRef,
        gameRegionRef,
        gunLevelRef,
        hudRef,
        invulnerableUntilRef,
        keysRef,
        lastFrameMsRef,
        lastShotMsRef,
        particlesRef,
        powerUpsRef,
        shipRef,
        starsRef,
        statusRef,
        targetsRef,
        transitionRef,
        viewportRef,
        wrapRef,
    } = refs;
    const { removeBody, setCanvasSize, setStatus, spawnWave, syncHud, wrapBody } = options;

    const shoot = useCallback(() => {
        const engine = engineRef.current;
        const ship = shipRef.current;
        if (!engine || !ship) return;
        const now = performance.now();
        if (now - lastShotMsRef.current < SHOT_COOLDOWN_MS) return;
        lastShotMsRef.current = now;

        const angle = ship.angle;
        const forwardX = Math.cos(angle);
        const forwardY = Math.sin(angle);
        const sideX = Math.cos(angle + Math.PI / 2);
        const sideY = Math.sin(angle + Math.PI / 2);
        const spawnBullet = (angleOffset: number, lateralOffset: number) => {
            const bulletAngle = angle + angleOffset;
            const noseX = ship.position.x + forwardX * 20 + sideX * lateralOffset;
            const noseY = ship.position.y + forwardY * 20 + sideY * lateralOffset;
            const bullet = Matter.Bodies.circle(noseX, noseY, 3, {
                label: 'bullet',
                isSensor: true,
                frictionAir: 0,
            });
            Matter.Body.setVelocity(bullet, {
                x: ship.velocity.x + Math.cos(bulletAngle) * 9,
                y: ship.velocity.y + Math.sin(bulletAngle) * 9,
            });
            bulletsRef.current.set(bullet.id, { body: bullet, bornAt: now });
            Matter.World.add(engine.world, bullet);
        };

        if (gunLevelRef.current === 1) {
            spawnBullet(0, 0);
            return;
        }

        if (gunLevelRef.current === 2) {
            spawnBullet(0, -7);
            spawnBullet(0, 7);
            return;
        }

        if (gunLevelRef.current === 3) {
            spawnBullet(0, 0);
            spawnBullet(-0.16, -6);
            spawnBullet(0.16, 6);
            return;
        }

        spawnBullet(-0.22, -9);
        spawnBullet(-0.08, -3);
        spawnBullet(0.08, 3);
        spawnBullet(0.22, 9);
    }, [bulletsRef, engineRef, gunLevelRef, lastShotMsRef, shipRef]);

    const handleControls = useCallback(() => {
        const ship = shipRef.current;
        if (!ship || statusRef.current !== 'playing') return;
        const keys = keysRef.current;
        if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) Matter.Body.rotate(ship, -0.075);
        if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) Matter.Body.rotate(ship, 0.075);
        if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
            Matter.Body.applyForce(ship, ship.position, {
                x: Math.cos(ship.angle) * 0.0015,
                y: Math.sin(ship.angle) * 0.0015,
            });
        }
        if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
            Matter.Body.setVelocity(ship, { x: ship.velocity.x * 0.965, y: ship.velocity.y * 0.965 });
        }
        if (keys.has(' ') || keys.has('Spacebar')) shoot();
    }, [keysRef, shipRef, shoot, statusRef]);

    const clearExpiredBullets = useCallback((now: number) => {
        for (const [id, bullet] of bulletsRef.current) {
            const { width, height } = viewportRef.current;
            const out =
                bullet.body.position.x < -60 ||
                bullet.body.position.x > width + 60 ||
                bullet.body.position.y < -60 ||
                bullet.body.position.y > height + 60;
            if (now - bullet.bornAt > BULLET_TTL_MS || out) {
                removeBody(bullet.body);
                bulletsRef.current.delete(id);
            }
        }
    }, [bulletsRef, removeBody, viewportRef]);

    const clearExpiredPowerUps = useCallback((now: number) => {
        for (const [id, powerUp] of powerUpsRef.current) {
            const { width, height } = viewportRef.current;
            const out =
                powerUp.body.position.x < -60 ||
                powerUp.body.position.x > width + 60 ||
                powerUp.body.position.y < -60 ||
                powerUp.body.position.y > height + 60;
            if (now - powerUp.bornAt > POWER_UP_TTL_MS || out) {
                removeBody(powerUp.body);
                powerUpsRef.current.delete(id);
            }
        }
    }, [powerUpsRef, removeBody, viewportRef]);

    const checkWaveClear = useCallback(() => {
        if (statusRef.current !== 'playing' || transitionRef.current || targetsRef.current.size > 0) return;
        transitionRef.current = true;
        const currentWave = hudRef.current.wave;
        const bonusHud = {
            ...hudRef.current,
            score: hudRef.current.score + currentWave * 250,
        };
        syncHud(bonusHud);

        statusRef.current = 'level-cleared';
        setStatus('level-cleared');
        window.setTimeout(() => {
            if (!engineRef.current || statusRef.current === 'game-over') return;
            const nextWave = currentWave + 1;
            const nextHud = { ...hudRef.current, wave: nextWave };
            syncHud(nextHud);
            spawnWave(nextWave);
            statusRef.current = 'playing';
            setStatus('playing');
            transitionRef.current = false;
        }, 900);
    }, [engineRef, hudRef, setStatus, spawnWave, statusRef, syncHud, targetsRef, transitionRef]);

    const resizeCanvas = useCallback(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const width = Math.max(320, Math.round(wrap.clientWidth || rect.width));
        const height = Math.max(220, Math.round(wrap.clientHeight || rect.height));
        viewportRef.current = { width, height };
        const pixelWidth = Math.max(160, Math.round(width / PIXEL_SCALE));
        const pixelHeight = Math.max(110, Math.round(height / PIXEL_SCALE));
        setCanvasSize(current =>
            current.width === pixelWidth && current.height === pixelHeight
                ? current
                : { width: pixelWidth, height: pixelHeight },
        );
    }, [setCanvasSize, viewportRef, wrapRef]);

    const draw = useCallback((timestamp: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const { width, height } = viewportRef.current;
        const sx = canvas.width / width;
        const sy = canvas.height / height;
        ctx.setTransform(sx, 0, 0, sy, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = '#08080A';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#111114';
        for (let y = 0; y < height; y += 8) ctx.fillRect(0, y, width, 2);
        const gameFontFamily = gameRegionRef.current ? window.getComputedStyle(gameRegionRef.current).fontFamily : 'monospace';

        for (const star of starsRef.current) {
            ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
            ctx.fillRect(snap(star.x * width), snap(star.y * height), 2, 2);
        }

        for (const target of targetsRef.current.values()) {
            const { x, y } = target.body.position;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(target.body.angle);
            if (target.logo.image) {
                ctx.save();
                addPixelCircleClip(ctx, 0, 0, target.radius, 4);
                ctx.drawImage(target.logo.image, -target.radius, -target.radius, target.radius * 2, target.radius * 2);
                ctx.restore();
            } else {
                drawFallbackLogo(ctx, target.logo, 0, 0, target.radius, gameFontFamily);
            }
            ctx.restore();
        }

        for (const bullet of bulletsRef.current.values()) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(snap(bullet.body.position.x) - 2, snap(bullet.body.position.y) - 2, 4, 4);
        }

        for (const powerUp of powerUpsRef.current.values()) {
            const pulse = 1 + Math.sin((timestamp - powerUp.bornAt) / 160) * 0.08;
            ctx.save();
            ctx.translate(powerUp.body.position.x, powerUp.body.position.y);
            ctx.rotate(powerUp.body.angle);
            if (powerUp.kind === 'heart') drawPixelHeartSprite(ctx, 0, 0, 3 * pulse, '#ff4b62', '#ffb0ba');
            if (powerUp.kind === 'gun') drawPixelGunUpgradeSprite(ctx, 0, 0, 3 * pulse, '#57e5c6', '#b2fff0');
            ctx.restore();
        }

        const ship = shipRef.current;
        if (ship) {
            const invulnerable = timestamp < invulnerableUntilRef.current;
            const thrusting = statusRef.current === 'playing' && (keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W'));
            ctx.save();
            ctx.translate(ship.position.x, ship.position.y);
            ctx.rotate(ship.angle);
            ctx.globalAlpha = invulnerable ? 0.55 + Math.sin(timestamp / 70) * 0.25 : 1;
            ctx.scale(SHIP_DRAW_SCALE, SHIP_DRAW_SCALE);
            drawPixelRocket(ctx, thrusting, timestamp);
            ctx.restore();
        }

        const nextParticles: Particle[] = [];
        for (const particle of particlesRef.current) {
            particle.life -= 16;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.985;
            particle.vy *= 0.985;
            if (particle.life > 0) {
                nextParticles.push(particle);
                ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
                ctx.fillStyle = particle.color;
                ctx.fillRect(snap(particle.x), snap(particle.y), Math.max(2, snap(particle.size)), Math.max(2, snap(particle.size)));
                ctx.globalAlpha = 1;
            }
        }
        particlesRef.current = nextParticles;
    }, [bulletsRef, canvasRef, gameRegionRef, invulnerableUntilRef, keysRef, particlesRef, powerUpsRef, shipRef, starsRef, statusRef, targetsRef, viewportRef]);

    const tick = useCallback((timestamp: number) => {
        const engine = engineRef.current;
        const previous = lastFrameMsRef.current || timestamp;
        const delta = Math.min(32, timestamp - previous || 16.67);
        lastFrameMsRef.current = timestamp;

        if (engine && statusRef.current === 'playing') {
            handleControls();
            Matter.Engine.update(engine, delta);
            const ship = shipRef.current;
            if (ship) wrapBody(ship);
            for (const target of targetsRef.current.values()) wrapBody(target.body);
            for (const powerUp of powerUpsRef.current.values()) wrapBody(powerUp.body);
            clearExpiredBullets(timestamp);
            clearExpiredPowerUps(timestamp);
            checkWaveClear();
        }

        draw(timestamp);
        frameRef.current = requestAnimationFrame(tick);
    }, [checkWaveClear, clearExpiredBullets, clearExpiredPowerUps, draw, engineRef, frameRef, handleControls, lastFrameMsRef, powerUpsRef, shipRef, statusRef, targetsRef, wrapBody]);

    return { resizeCanvas, tick };
}

interface GameHudProps {
    gunLevel: number;
    highScore: number;
    hud: HudState;
    onClose: () => void;
    onRestart: () => void;
    status: GameStatus;
}

function GameHud({ gunLevel, highScore, hud, onClose, onRestart, status }: GameHudProps) {
    return (
        <>
            <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-4 text-[12px] tracking-normal text-white uppercase [text-shadow:2px_2px_0_#000] sm:inset-x-4 sm:top-4 sm:text-[13px]">
                <span className="inline-flex items-center gap-2" aria-label={`${hud.lives} lives remaining`}>
                    {Array.from({ length: Math.max(STARTING_LIVES, hud.lives) }, (_, index) => (
                        <PixelHeart
                            key={index}
                            filled={index < hud.lives}
                            accent={index >= STARTING_LIVES ? 'yellow' : 'red'}
                        />
                    ))}
                </span>
                <div className="pointer-events-auto flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="Restart"
                        className="inline-flex size-9 items-center justify-center border border-[#2c2c2d] bg-[#08080A]/72 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                        onClick={onRestart}
                        disabled={status === 'loading'}
                    >
                        <RotateCcw className="size-4" />
                    </button>
                    <button
                        type="button"
                        aria-label="Close"
                        className="inline-flex size-9 items-center justify-center border border-[#2c2c2d] bg-[#08080A]/72 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                        onClick={onClose}
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>
            <div className="pointer-events-none absolute right-3 bottom-3 z-10 flex flex-wrap justify-end gap-x-5 gap-y-1 text-right text-[12px] tracking-normal text-white uppercase [text-shadow:2px_2px_0_#000] sm:right-4 sm:bottom-4 sm:text-[13px]">
                <span>
                    <span className="mr-1 text-text-extra-low">Score</span>
                    <span className="font-bold tabular-nums">{hud.score}</span>
                </span>
                <span>
                    <span className="mr-1 text-text-extra-low">Best</span>
                    <span className="font-bold tabular-nums">{highScore}</span>
                </span>
                <span>
                    <span className="mr-1 text-text-extra-low">Round</span>
                    <span className="font-bold tabular-nums">{hud.wave}</span>
                </span>
                <span>
                    <span className="mr-1 text-text-extra-low">Gun</span>
                    <span className="font-bold tabular-nums">{gunLevel}</span>
                </span>
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-x-4 gap-y-1 pr-40 text-[11px] tracking-normal text-text-extra-low uppercase [text-shadow:2px_2px_0_#000] sm:bottom-4 sm:left-4 sm:max-w-[70%] sm:pr-0 sm:text-[12px]">
                <span><kbd className="text-text-high">WASD</kbd> / <kbd className="text-text-high">Arrows</kbd> move</span>
                <span><kbd className="text-text-high">Space</kbd> shoot</span>
                <span><kbd className="text-text-high">Esc</kbd> close</span>
            </div>
        </>
    );
}

interface GameOverlayProps {
    copy: { title: string; body: string };
    onRestart: () => void;
    status: GameStatus;
}

function GameOverlay({ copy, onRestart, status }: GameOverlayProps) {
    return (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
            <div className="pointer-events-auto flex max-w-[390px] flex-col items-center gap-5 border border-[#2c2c2d] bg-[#08080A] px-6 py-6 text-center shadow-none">
                <div className="space-y-2">
                    <h3 className="text-[28px] leading-none font-bold text-white uppercase sm:text-[30px]">{copy.title}</h3>
                    <p className="text-[15px] leading-6 text-text-low sm:text-[16px]">{copy.body}</p>
                </div>
                <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center border border-[#2c2c2d] bg-white px-5 text-[15px] font-bold uppercase text-black transition-transform hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={onRestart}
                    disabled={status === 'loading'}
                >
                    {status === 'ready' ? 'Play' : 'Restart'}
                </button>
            </div>
        </div>
    );
}

export function TokenAsteroidsGame({ open, onOpenChange }: TokenAsteroidsGameProps) {
    const [status, setStatus] = useState<GameStatus>('loading');
    const [hud, setHud] = useState<HudState>({ score: 0, lives: STARTING_LIVES, wave: 1 });
    const [highScore, setHighScore] = useState(0);
    const [isNewBestRun, setIsNewBestRun] = useState(false);
    const [gunLevel, setGunLevel] = useState(1);
    const [canvasSize, setCanvasSize] = useState<Viewport>({ width: 800, height: 450 });

    const refs = useAsteroidsRefs();
    const {
        canvasRef,
        collisionHandlerRef,
        engineRef,
        frameRef,
        gameRegionRef,
        gunLevelRef,
        highScoreRef,
        hudRef,
        keysRef,
        prefersReducedMotionRef,
        statusRef,
        targetPoolRef,
        wrapRef,
    } = refs;

    useEffect(() => {
        statusRef.current = status;
    }, [status, statusRef]);

    useEffect(() => {
        hudRef.current = hud;
    }, [hud, hudRef]);

    useEffect(() => {
        gunLevelRef.current = gunLevel;
    }, [gunLevel, gunLevelRef]);

    useEffect(() => {
        if (!open) return;
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        prefersReducedMotionRef.current = media.matches;
        const handleChange = () => {
            prefersReducedMotionRef.current = media.matches;
        };
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, [open, prefersReducedMotionRef]);

    const updateHighScore = useCallback((score: number) => {
        if (score <= highScoreRef.current) return;
        highScoreRef.current = score;
        setHighScore(score);
        setIsNewBestRun(true);
        try {
            window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
        } catch {
            // Ignore storage failures; the in-session high score still updates.
        }
    }, [highScoreRef]);

    const syncHud = useCallback((next: HudState) => {
        hudRef.current = next;
        setHud(next);
        updateHighScore(next.score);
    }, [hudRef, updateHighScore]);

    const {
        addBreakParticles,
        addParticles,
        cleanupWorld,
        createShip,
        removeBody,
        spawnTarget,
        spawnWave,
        spawnWaveRewardChoice,
        wrapBody,
    } = useAsteroidsWorld(refs);

    const { onCollisionStart } = useAsteroidsCollisions(refs, {
        addBreakParticles,
        addParticles,
        removeBody,
        setGunLevel,
        setStatus,
        spawnTarget,
        spawnWaveRewardChoice,
        syncHud,
    });

    const { resizeCanvas, tick } = useAsteroidsLoop(refs, {
        removeBody,
        setCanvasSize,
        setStatus,
        spawnWave,
        syncHud,
        wrapBody,
    });

    const beginRun = useCallback(() => {
        cleanupWorld({ cancelLoop: false });
        setIsNewBestRun(false);
        setGunLevel(1);
        const engine = Matter.Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
        engineRef.current = engine;
        collisionHandlerRef.current = onCollisionStart;
        Matter.Events.on(engine, 'collisionStart', onCollisionStart);
        const nextHud = { score: 0, lives: STARTING_LIVES, wave: 1 };
        syncHud(nextHud);
        createShip();
        spawnWave(1);
        statusRef.current = 'playing';
        setStatus('playing');
        gameRegionRef.current?.focus({ preventScroll: true });
    }, [cleanupWorld, collisionHandlerRef, createShip, engineRef, gameRegionRef, onCollisionStart, spawnWave, statusRef, syncHud]);

    useEffect(() => {
        if (!open) return;
        setStatus('loading');
        statusRef.current = 'loading';
        try {
            const stored = Number.parseInt(window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY) ?? '0', 10);
            const nextHighScore = Number.isFinite(stored) ? Math.max(0, stored) : 0;
            highScoreRef.current = nextHighScore;
            setHighScore(nextHighScore);
        } catch {
            highScoreRef.current = 0;
            setHighScore(0);
        }

        void hydrateTargets(buildStaticTargetCandidates())
            .then(targets => {
                targetPoolRef.current = targets;
                setStatus('ready');
                statusRef.current = 'ready';
                window.setTimeout(() => gameRegionRef.current?.focus({ preventScroll: true }), 0);
            })
            .catch(() => {
                targetPoolRef.current = buildStaticTargetCandidates().map(target => ({ ...target, image: null }));
                setStatus('ready');
                statusRef.current = 'ready';
                window.setTimeout(() => gameRegionRef.current?.focus({ preventScroll: true }), 0);
            });
    }, [gameRegionRef, highScoreRef, open, statusRef, targetPoolRef]);

    useEffect(() => {
        if (!open) return;
        resizeCanvas();
        const wrap = wrapRef.current;
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resizeCanvas);
        if (wrap && observer) observer.observe(wrap);
        return () => observer?.disconnect();
    }, [open, resizeCanvas, wrapRef]);

    useEffect(() => {
        if (!open) return;
        frameRef.current = requestAnimationFrame(tick);
        return cleanupWorld;
    }, [cleanupWorld, frameRef, open, tick]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
                return;
            }
            if (CONTROL_KEYS.has(event.key)) event.preventDefault();
            if ((event.key === ' ' || event.key === 'Spacebar') && (statusRef.current === 'ready' || statusRef.current === 'game-over')) {
                beginRun();
                return;
            }
            keysRef.current.add(event.key);
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            keysRef.current.delete(event.key);
        };
        window.addEventListener('keydown', handleKeyDown, { passive: false });
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [beginRun, keysRef, onOpenChange, open, statusRef]);

    const overlayCopy = useMemo(() => {
        if (status === 'loading') return { title: 'Loading token field', body: 'Preparing token logos and your local best score.' };
        if (status === 'ready') return { title: 'Tokens Asteroids', body: 'Survive endless token waves and chase your local high score.' };
        if (status === 'level-cleared') return { title: 'Wave cleared', body: 'Next token wave inbound.' };
        if (status === 'game-over') return { title: 'Game over', body: isNewBestRun ? 'New local high score. Run it back.' : 'Restart and beat your local high score.' };
        if (status === 'error') return { title: 'Fallback mode', body: 'Some logos are unavailable, but local targets are ready.' };
        return null;
    }, [isNewBestRun, status]);

    if (!open) return null;

    return (
        <div
            className={`${GeistPixelSquare.className} dark mx-auto w-full max-w-none overflow-hidden rounded-none border border-[#2c2c2d] bg-[#08080A] p-0 text-text-extra-high`}
        >
            <p className="sr-only">
                A keyboard-controlled Asteroids game where the Tokens ship shoots incoming asset logos.
            </p>
            <div
                ref={gameRegionRef}
                tabIndex={-1}
                className="outline-none"
                aria-label="Tokens Asteroids game"
            >
                <div ref={wrapRef} className="relative flex aspect-[16/9] max-h-[62dvh] min-h-[260px] w-full items-start justify-start overflow-hidden bg-[#0F0F10]">
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className="block size-full shrink-0 [image-rendering:pixelated]"
                    />
                    <GameHud
                        gunLevel={gunLevel}
                        highScore={highScore}
                        hud={hud}
                        onClose={() => onOpenChange(false)}
                        onRestart={beginRun}
                        status={status}
                    />
                    {overlayCopy && <GameOverlay copy={overlayCopy} onRestart={beginRun} status={status} />}
                </div>
            </div>
        </div>
    );
}
