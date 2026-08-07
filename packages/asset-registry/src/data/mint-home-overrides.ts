/**
 * When a mint appears in multiple canonical assets, we require an explicit
 * "home" hub to keep mint → hub resolution deterministic.
 *
 * This map is enforced at module init time in `src/registry.ts`.
 */
export const MINT_HOME_OVERRIDES: Record<string, string /* hub assetId */> = {
    // SUI mint appears in both `sui` and `xstock-sui`; keep the crypto hub as canonical home.
    suifhC9gU1VbJAPYPTBkHJyyyStKGLLYPVDTmPoqbvA: 'sui',
    // SPDR Gold Shares (Ondo) mint appears in both `gold` and `spdr-gold-shares`; keep the commodity hub as canonical home.
    hWfiw4mcxT8rnNFkk6fsCQSxoxgZ9yVhB6tyeVcondo: 'gold',
};
