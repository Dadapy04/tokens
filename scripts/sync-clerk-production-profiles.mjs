import { loadLocalEnv } from './_env.mjs';

const CLERK_API_BASE = 'https://api.clerk.com/v1';

function hasFlag(name) {
    return process.argv.includes(`--${name}`);
}

function requireEnv(name, value) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) throw new Error(`Missing ${name}`);
    return trimmed;
}

function clerkExternalId(user) {
    return user.external_id ?? user.externalId ?? null;
}

function clerkImageUrl(user) {
    return user.image_url ?? user.imageUrl ?? user.profile_image_url ?? user.profileImageUrl ?? null;
}

function clerkNamePatch(user) {
    const firstName = user.first_name ?? user.firstName;
    const lastName = user.last_name ?? user.lastName;
    const username = user.username;

    return {
        ...(typeof firstName === 'string' && firstName.trim() ? { first_name: firstName.trim() } : {}),
        ...(typeof lastName === 'string' && lastName.trim() ? { last_name: lastName.trim() } : {}),
        ...(typeof username === 'string' && username.trim() ? { username: username.trim() } : {}),
    };
}

async function clerkFetchJson(pathname, { method = 'GET', body, secretKey }) {
    const response = await fetch(`${CLERK_API_BASE}${pathname}`, {
        method,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message =
            data?.errors?.[0]?.long_message ??
            data?.errors?.[0]?.message ??
            data?.error?.message ??
            `${method} ${pathname} failed with ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

async function clerkFetchForm(pathname, { body, secretKey }) {
    const response = await fetch(`${CLERK_API_BASE}${pathname}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secretKey}`,
        },
        body,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const message =
            data?.errors?.[0]?.long_message ??
            data?.errors?.[0]?.message ??
            data?.error?.message ??
            `POST ${pathname} failed with ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

async function getClerkUser(userId, secretKey) {
    try {
        return await clerkFetchJson(`/users/${encodeURIComponent(userId)}`, { secretKey });
    } catch (error) {
        if (error.status === 404) return null;
        throw error;
    }
}

async function listClerkUsers(secretKey) {
    const users = [];
    const limit = 100;

    for (let offset = 0; ; offset += limit) {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        });
        const data = await clerkFetchJson(`/users?${params}`, { secretKey });
        const page = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        users.push(...page);

        const totalCount = data?.total_count ?? data?.totalCount;
        if (typeof totalCount === 'number' && users.length >= totalCount) break;
        if (page.length < limit) break;
    }

    return users;
}

async function updateProfileImage(prodUserId, imageUrl, secretKey) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download profile image: ${response.status}`);

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || blob.type || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const form = new FormData();
    form.append('file', blob, `profile-image.${extension}`);

    return await clerkFetchForm(`/users/${encodeURIComponent(prodUserId)}/profile_image`, {
        secretKey,
        body: form,
    });
}

await loadLocalEnv();

const apply = hasFlag('apply');
const includeImages = hasFlag('include-images');
const allowTestProd = hasFlag('allow-test-prod');

const prodSecretKey = requireEnv(
    'CLERK_PRODUCTION_SECRET_KEY (or CLERK_PROD_SECRET_KEY)',
    process.env.CLERK_PRODUCTION_SECRET_KEY ?? process.env.CLERK_PROD_SECRET_KEY,
);
const devSecretKey = requireEnv(
    'CLERK_DEVELOPMENT_SECRET_KEY (or CLERK_DEV_SECRET_KEY)',
    process.env.CLERK_DEVELOPMENT_SECRET_KEY ?? process.env.CLERK_DEV_SECRET_KEY,
);

if (!allowTestProd && !prodSecretKey.startsWith('sk_live_')) {
    throw new Error('Refusing to use a non-production Clerk secret. Pass --allow-test-prod only for rehearsal.');
}

const prodUsers = await listClerkUsers(prodSecretKey);
const mappedProdUsers = prodUsers.filter(user => typeof clerkExternalId(user) === 'string' && clerkExternalId(user));

let missingDevUser = 0;
let profilePatchable = 0;
let profilePatched = 0;
let imagePatchable = 0;
let imagePatched = 0;
const failures = [];

for (const prodUser of mappedProdUsers) {
    const oldUserId = clerkExternalId(prodUser);
    const devUser = await getClerkUser(oldUserId, devSecretKey);

    if (!devUser) {
        missingDevUser++;
        continue;
    }

    const patch = clerkNamePatch(devUser);
    const imageUrl = clerkImageUrl(devUser);

    if (Object.keys(patch).length > 0) {
        profilePatchable++;

        if (apply) {
            try {
                await clerkFetchJson(`/users/${encodeURIComponent(prodUser.id)}`, {
                    method: 'PATCH',
                    secretKey: prodSecretKey,
                    body: patch,
                });
                profilePatched++;
            } catch (error) {
                failures.push({
                    userId: prodUser.id,
                    externalId: oldUserId,
                    field: 'profile',
                    message: error.message,
                    status: error.status,
                });
            }
        }
    }

    if (imageUrl) {
        imagePatchable++;

        if (apply && includeImages) {
            try {
                await updateProfileImage(prodUser.id, imageUrl, prodSecretKey);
                imagePatched++;
            } catch (error) {
                failures.push({
                    userId: prodUser.id,
                    externalId: oldUserId,
                    field: 'image',
                    message: error.message,
                    status: error.status,
                });
            }
        }
    }
}

console.log(
    [
        'Clerk profile sync',
        `apply=${apply}`,
        `includeImages=${includeImages}`,
        `productionUsers=${prodUsers.length}`,
        `mappedUsers=${mappedProdUsers.length}`,
        `missingDevUser=${missingDevUser}`,
        `profilePatchable=${profilePatchable}`,
        `profilePatched=${profilePatched}`,
        `imagePatchable=${imagePatchable}`,
        `imagePatched=${imagePatched}`,
        `failures=${failures.length}`,
    ].join(' | '),
);

if (failures.length > 0) {
    console.log(JSON.stringify({ failures: failures.slice(0, 20) }, null, 2));
}

if (!apply) {
    console.log('Dry run only. Re-run with --apply --include-images to copy username/name and profile images.');
} else if (!includeImages) {
    console.log('Profile names/usernames were applied. Re-run with --apply --include-images to copy profile images.');
}
