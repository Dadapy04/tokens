import { Storage } from '@google-cloud/storage';

import type { LogoUploadSigner } from './handlers/logoUploads';

const SIGNED_URL_TTL_MS = 10 * 60 * 1000;

/**
 * V4 signed-PUT signer for the public asset-logo bucket. Requires the runtime
 * service account to hold `roles/storage.objectAdmin` on the bucket and
 * `roles/iam.serviceAccountTokenCreator` on itself (keyless signBlob) — both
 * granted in terraform (`asset_logos_runtime_writer`,
 * `runtime_sa_self_token_creator`).
 */
export function makeGcsLogoSigner(bucket: string, publicBaseUrl?: string): LogoUploadSigner {
    const storage = new Storage();
    const base = (publicBaseUrl ?? `https://storage.googleapis.com/${bucket}`).replace(/\/$/, '');

    return {
        async signPutUrl(objectName, contentType) {
            const [url] = await storage
                .bucket(bucket)
                .file(objectName)
                .getSignedUrl({
                    version: 'v4',
                    action: 'write',
                    expires: Date.now() + SIGNED_URL_TTL_MS,
                    contentType,
                });
            return url;
        },
        publicUrl(objectName) {
            return `${base}/${objectName}`;
        },
    };
}
