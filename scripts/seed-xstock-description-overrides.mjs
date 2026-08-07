import { loadLocalEnv } from './_env.mjs';
import { callCloudRun, cloudRunEnabled } from './_cloudrun.mjs';

const XSTOCK_DESCRIPTION_OVERRIDES = {
    adobe:
        'Adobe Inc. develops creative, document, and digital experience software, including Photoshop, Illustrator, Acrobat, Creative Cloud, and enterprise marketing tools.',
    'american-express':
        'American Express Company provides payment card products, merchant services, travel services, and financial products for consumers, small businesses, and corporations.',
    apple:
        'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and provides services including the App Store, Apple Music, iCloud, AppleCare, and payment services.',
    asml:
        'ASML Holding N.V. supplies advanced lithography systems used by semiconductor manufacturers to produce integrated circuits, including extreme ultraviolet lithography equipment.',
    'ast-spacemobile':
        'AST SpaceMobile is developing a space-based cellular broadband network designed to connect standard mobile phones directly through satellites.',
    'berkshire-hathaway':
        'Berkshire Hathaway Inc. is a diversified holding company with businesses spanning insurance, railroads, energy, manufacturing, retail, and a large public equities portfolio.',
    bitfufu:
        'BitFuFu Inc. provides digital asset mining services, including cloud mining products, miner hosting, and hash rate services for institutional and retail customers.',
    blackrock:
        'BlackRock, Inc. is a global asset manager providing investment management, risk management, advisory services, ETFs, mutual funds, and institutional portfolio solutions.',
    booking:
        'Booking Holdings Inc. operates online travel and restaurant reservation platforms, including Booking.com, Priceline, Agoda, Rentalcars.com, Kayak, and OpenTable.',
    bullish:
        'Bullish operates a digital asset exchange and related market infrastructure focused on cryptocurrency trading, liquidity, and institutional-grade exchange services.',
    cleanspark:
        'CleanSpark, Inc. is a bitcoin mining company that owns and operates data centers powered by a mix of energy sources across the United States.',
    'core-scientific':
        'Core Scientific, Inc. provides digital infrastructure for bitcoin mining and high-performance compute, including owned mining operations and hosting services.',
    costco:
        'Costco Wholesale Corporation operates membership warehouses that sell groceries, household goods, electronics, apparel, fuel, pharmacy products, and other merchandise.',
    duolingo:
        'Duolingo, Inc. operates a mobile learning platform for language education, literacy, math, music, and related subscription-based learning products.',
    ebay:
        'eBay Inc. operates a global online marketplace connecting buyers and sellers across categories including collectibles, electronics, fashion, parts, and home goods.',
    expedia:
        'Expedia Group, Inc. operates online travel brands and platforms for lodging, flights, car rentals, vacation packages, activities, and business travel services.',
    figma:
        'Figma provides a collaborative design platform used for interface design, prototyping, design systems, whiteboarding, and product development workflows.',
    'galaxy-digital':
        'Galaxy Digital provides digital asset and blockchain services, including trading, asset management, investment banking, mining, and infrastructure solutions.',
    'hut-8':
        'Hut 8 Corp. operates digital asset mining and computing infrastructure businesses, including bitcoin mining, managed services, and data center operations.',
    lululemon:
        'Lululemon Athletica Inc. designs and sells athletic apparel, footwear, and accessories for yoga, running, training, and other fitness activities.',
    mara:
        'MARA Holdings, Inc. is a digital asset technology company focused on bitcoin mining, energy optimization, and blockchain infrastructure operations.',
    'mcdonald-s':
        "McDonald's Corporation operates and franchises quick-service restaurants globally, serving burgers, chicken, breakfast items, beverages, desserts, and related menu products.",
    monster:
        'Monster Beverage Corporation develops, markets, and sells energy drinks and alternative beverages under brands including Monster Energy and related beverage lines.',
    oklo:
        'Oklo Inc. is developing advanced fission power plants and nuclear fuel recycling technologies to provide clean, reliable energy for commercial and industrial customers.',
    open:
        'Opendoor Technologies Inc. operates a digital real estate platform that helps customers buy, sell, and transact residential homes online.',
    palantir:
        'Palantir Technologies Inc. develops data integration, analytics, and artificial intelligence software platforms used by commercial organizations and government agencies.',
    'palo-alto-networks':
        'Palo Alto Networks, Inc. provides cybersecurity platforms and services across network security, cloud security, endpoint protection, threat intelligence, and security operations.',
    paypal:
        'PayPal Holdings, Inc. operates digital payments platforms that enable consumers and merchants to send, receive, and manage payments online and in person.',
    'planet-labs':
        'Planet Labs PBC designs, builds, and operates Earth observation satellites and provides geospatial data, imagery, and analytics for commercial and government customers.',
    'riot-platforms':
        'Riot Platforms, Inc. is a bitcoin mining and digital infrastructure company with mining operations, power strategies, and data center capabilities.',
    robinhood:
        'Robinhood Markets, Inc. operates a financial services platform offering commission-free trading, retirement accounts, cash management, crypto trading, and related investing products.',
    roblox:
        'Roblox Corporation operates an online platform where users create, share, and play immersive 3D experiences, games, and virtual social environments.',
    'rocket-lab':
        'Rocket Lab USA, Inc. provides space launch services, spacecraft components, satellite manufacturing, and mission management for commercial and government customers.',
    'sharplink-gaming':
        'SharpLink Gaming, Inc. is a digital sports technology company focused on online betting engagement, affiliate marketing, and treasury strategies involving digital assets.',
    't-mobile':
        'T-Mobile US, Inc. provides wireless voice, messaging, broadband, and data services to consumers, businesses, and government customers across the United States.',
    target:
        'Target Corporation operates general merchandise and grocery stores, offering apparel, home goods, electronics, beauty products, food, and digital retail services.',
    'tempus-ai':
        'Tempus AI, Inc. applies artificial intelligence and multimodal data to precision medicine, diagnostics, clinical research, and healthcare decision support.',
    terawulf:
        'TeraWulf Inc. develops and operates bitcoin mining facilities powered by low-cost energy, with a focus on zero-carbon and renewable energy sources.',
    ton:
        'TON Strategy Company is a publicly traded company focused on treasury and strategy initiatives around The Open Network ecosystem and digital assets.',
    tsmc:
        'Taiwan Semiconductor Manufacturing Company manufactures semiconductors for customers globally, providing foundry services for advanced logic, specialty, and packaging technologies.',
    uber:
        'Uber Technologies, Inc. operates a technology platform for ridesharing, food and grocery delivery, freight, and other mobility and logistics services.',
    'virgin-galactic':
        'Virgin Galactic Holdings, Inc. is an aerospace and space travel company developing commercial human spaceflight experiences and related spacecraft technologies.',
    vistra:
        'Vistra Corp. is an integrated retail electricity and power generation company with natural gas, nuclear, solar, battery storage, and other energy assets.',
    'wendy-s':
        "The Wendy's Company operates and franchises quick-service restaurants known for hamburgers, chicken sandwiches, fries, beverages, breakfast items, and related menu products.",
};

function getArg(name, fallback = null) {
    const flag = `--${name}`;
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    return fallback;
}

function toBool(value, fallback) {
    if (value == null) return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return fallback;
}

await loadLocalEnv();

if (!cloudRunEnabled('assets')) {
    throw new Error(
        'Cloud Run backend is not configured. Set TOKENS_CLOUDRUN_ENABLED=true (or TOKENS_CLOUDRUN_ASSETS_URL) and TOKENS_CLOUDRUN_AUTH_TOKEN. The target deployment is selected by these env vars (the old --prod Convex flag is gone).',
    );
}

const dryRun = toBool(getArg('dry-run', 'false'), false);
const onlyAssets = new Set(
    String(getArg('assets', '') ?? '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean),
);

let updated = 0;
let skipped = 0;

for (const [assetId, description] of Object.entries(XSTOCK_DESCRIPTION_OVERRIDES)) {
    if (onlyAssets.size > 0 && !onlyAssets.has(assetId)) continue;

    const asset = await callCloudRun('assets', 'query', 'getByAssetId', { assetId, includeInactive: true });
    if (!asset) {
        skipped += 1;
        console.log(JSON.stringify({ assetId, skipped: 'missing_asset' }));
        continue;
    }

    if ((asset.description ?? '').trim() === description.trim()) {
        skipped += 1;
        continue;
    }

    console.log(
        JSON.stringify({
            assetId,
            name: asset.name,
            dryRun,
            previousLength: (asset.description ?? '').trim().length,
            nextLength: description.length,
            nextDescription: description,
        }),
    );

    if (!dryRun) {
        await callCloudRun('assets', 'mutation', 'setAssetDescriptionByAssetId', { assetId, description });
    }
    updated += 1;
}

console.log(JSON.stringify({ updated, skipped, total: Object.keys(XSTOCK_DESCRIPTION_OVERRIDES).length }, null, 2));
