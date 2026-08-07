import { CURATED_LIST_ORDER, type CuratedTokenListId } from '@tokens/asset-registry/compat';

export type CuratedTokenListIdWithoutLsts = Exclude<CuratedTokenListId, 'lsts'>;

export const CURATED_LIST_ORDER_WITHOUT_LSTS: CuratedTokenListIdWithoutLsts[] = CURATED_LIST_ORDER.filter(
    (listId): listId is CuratedTokenListIdWithoutLsts => listId !== 'lsts',
);
