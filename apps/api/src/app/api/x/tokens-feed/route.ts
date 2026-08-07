import { Effect } from 'effect';

import { fetchJsonWithRetry, tapErrorAndDefault } from '@tokens/effect';
import { route } from '@/effect/next-route';
import { buildMediaByKey, getPostImage, type XMedia, type XPostMediaAttachment } from '@/lib/x-media';

interface NewsFeedArticle {
    title: string;
    url: string;
    image: string;
    author: string;
    posted_at: string;
    type: 'news';
    source_name: string;
    related_coin_ids: string[];
}

interface XUser {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
}

interface XUserLookupResponse {
    data?: XUser;
}

interface XPost {
    id: string;
    text: string;
    created_at?: string;
    attachments?: XPostMediaAttachment;
    in_reply_to_user_id?: string;
    referenced_tweets?: { type: string; id: string }[];
}

// The X API's `exclude=replies` param is not always honored, so filter defensively:
// replies don't read as cleanly as standalone posts in the feed.
function isReplyPost(post: XPost): boolean {
    if (post.in_reply_to_user_id) return true;
    return post.referenced_tweets?.some(reference => reference.type === 'replied_to') ?? false;
}

interface XUserPostsResponse {
    data?: XPost[];
    includes?: {
        media?: XMedia[];
    };
}

const X_USERNAME = 'tokens';
const DEFAULT_POST_LIMIT = 10;
const MIN_X_RESULTS = 5;
const MAX_X_RESULTS = 20;

let cachedBearerToken: string | null = null;

function invalidateCachedBearerToken(): void {
    cachedBearerToken = null;
}

function parseLimit(value: string | null): number {
    const parsed = Number.parseInt(value ?? '', 10);
    if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_POST_LIMIT;
    return Math.min(Math.max(parsed, MIN_X_RESULTS), MAX_X_RESULTS);
}

function cleanPostText(value: string): string {
    return value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

async function resolveXBearerToken(): Promise<string | null> {
    const existingBearerToken = process.env.X_BEARER_TOKEN?.trim();
    if (existingBearerToken) return existingBearerToken;
    if (cachedBearerToken) return cachedBearerToken;

    const apiKey = process.env.X_API_KEY?.trim();
    const apiSecret = process.env.X_API_SECRET?.trim();
    if (!apiKey || !apiSecret) return null;

    const credentials = `${encodeURIComponent(apiKey)}:${encodeURIComponent(apiSecret)}`;
    const authorization = Buffer.from(credentials).toString('base64');
    const response = await fetch('https://api.x.com/oauth2/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${authorization}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        throw new Error(`Failed to resolve X bearer token (${response.status})`);
    }

    const data = (await response.json()) as { token_type?: string; access_token?: string };
    if (data.token_type?.toLowerCase() !== 'bearer' || !data.access_token) {
        throw new Error('X bearer token response was invalid');
    }

    cachedBearerToken = data.access_token;
    return cachedBearerToken;
}

function buildXPostUrl(username: string, postId: string): string {
    return `https://x.com/${encodeURIComponent(username)}/status/${encodeURIComponent(postId)}`;
}

async function runXRequest<T>(request: Effect.Effect<T, unknown, never>): Promise<T> {
    try {
        return await Effect.runPromise(request);
    } catch (error) {
        invalidateCachedBearerToken();
        throw error;
    }
}

export const GET = route(
    (request: Request) =>
        Effect.gen(function* () {
            const requestUrl = new URL(request.url);
            const limit = parseLimit(requestUrl.searchParams.get('limit'));

            const bearerToken = yield* Effect.tryPromise(() => resolveXBearerToken()).pipe(
                tapErrorAndDefault('x.tokensFeed.resolveBearerToken', null),
            );
            if (!bearerToken) return [] satisfies NewsFeedArticle[];

            const authHeaders = {
                Accept: 'application/json',
                Authorization: `Bearer ${bearerToken}`,
            };

            const userUrl = new URL(`https://api.x.com/2/users/by/username/${X_USERNAME}`);
            userUrl.searchParams.set('user.fields', 'id,name,username,profile_image_url');

            const userResponse: XUserLookupResponse = yield* Effect.tryPromise(() =>
                runXRequest(fetchJsonWithRetry<XUserLookupResponse>({
                    url: userUrl.toString(),
                    service: 'x',
                    init: {
                        headers: authHeaders,
                        next: { revalidate: 60 },
                    },
                    maxRetries: 2,
                })),
            ).pipe(tapErrorAndDefault('x.tokensFeed.userLookup', {} as XUserLookupResponse));

            const user = userResponse.data;
            if (!user?.id) return [] satisfies NewsFeedArticle[];

            const postsUrl = new URL(`https://api.x.com/2/users/${user.id}/tweets`);
            postsUrl.searchParams.set('max_results', String(limit));
            postsUrl.searchParams.set('exclude', 'retweets,replies');
            postsUrl.searchParams.set('tweet.fields', 'attachments,created_at,text,in_reply_to_user_id,referenced_tweets');
            postsUrl.searchParams.set('expansions', 'attachments.media_keys');
            postsUrl.searchParams.set('media.fields', 'media_key,preview_image_url,type,url');

            const postsResponse: XUserPostsResponse = yield* Effect.tryPromise(() =>
                runXRequest(fetchJsonWithRetry<XUserPostsResponse>({
                    url: postsUrl.toString(),
                    service: 'x',
                    init: {
                        headers: authHeaders,
                        next: { revalidate: 60 },
                    },
                    maxRetries: 2,
                })),
            ).pipe(tapErrorAndDefault('x.tokensFeed.userPosts', {} as XUserPostsResponse));
            const mediaByKey = buildMediaByKey(postsResponse.includes?.media);

            return (postsResponse.data ?? [])
                .filter(post => post.id && post.text && post.created_at && !isReplyPost(post))
                .map(post => ({
                    title: cleanPostText(post.text),
                    url: buildXPostUrl(user.username, post.id),
                    image: getPostImage(post, mediaByKey, user.profile_image_url),
                    author: user.username,
                    posted_at: post.created_at ?? '',
                    type: 'news' as const,
                    source_name: `@${user.username}`,
                    related_coin_ids: [],
                }))
                .slice(0, limit) satisfies NewsFeedArticle[];
        }),
    { platform: { requiredScopes: ['assets:read'] } },
);
