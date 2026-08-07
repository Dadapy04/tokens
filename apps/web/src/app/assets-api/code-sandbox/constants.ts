export const HOLD_MS = 1400;
export const DELETE_MS_PER_CHAR = 45;
export const IDLE_MS = 220;
export const TYPE_MS_PER_CHAR = 230;
export const FETCH_BEAT_MS = 320;

export const IDLE_TIMEOUT_MS = 60_000;
export const USER_FETCH_DEBOUNCE_MS = 80;
export const VISIBLE_RESULTS = 5;
export const VISIBLE_RESULTS_MOBILE = 3;

export const RESULT_CARD_SHADOW =
    'inset 0 1px 0 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.12), 0 1px 1px -0.5px rgba(0,0,0,0.18), 0 3px 3px -1.5px rgba(0,0,0,0.18)';

export const STATUS_OK_DOT = '#00FFA3';
export const STATUS_ERR_DOT = '#FF6B6B';
export const PRICE_UP = '#00FFA3';
export const PRICE_DOWN = '#FF6B6B';

// Larsenwork "scrim" gradient — multi-stop ease-out approximation of cubic-bezier
// (vs. a 2-stop linear gradient which produces visible perceptual edges).
// Solid for the top 70%, then 13-stop smooth fade to transparent across the bottom 30%.
export const FADE_MASK =
    'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.738) 75.7%, rgba(0,0,0,0.541) 80.2%, rgba(0,0,0,0.382) 84.1%, rgba(0,0,0,0.278) 87%, rgba(0,0,0,0.194) 89.5%, rgba(0,0,0,0.126) 91.9%, rgba(0,0,0,0.075) 94.1%, rgba(0,0,0,0.042) 95.8%, rgba(0,0,0,0.021) 97.3%, rgba(0,0,0,0.008) 98.6%, rgba(0,0,0,0.002) 99.5%, rgba(0,0,0,0) 100%)';
