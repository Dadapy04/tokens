export interface XPostMediaAttachment {
    media_keys?: string[];
}

export interface XPostWithMediaAttachments {
    attachments?: XPostMediaAttachment;
}

export interface XMedia {
    media_key: string;
    type?: string;
    url?: string;
    preview_image_url?: string;
}

export function isSafeHref(value: string | undefined | null): value is string {
    if (!value) return false;

    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

export function buildMediaByKey(media: XMedia[] | undefined): Map<string, XMedia> {
    return new Map((media ?? []).filter(item => item.media_key).map(item => [item.media_key, item]));
}

export function getPostImage(
    post: XPostWithMediaAttachments,
    mediaByKey: Map<string, XMedia>,
    fallbackImage: string | undefined,
): string {
    for (const mediaKey of post.attachments?.media_keys ?? []) {
        const media = mediaByKey.get(mediaKey);
        if (!media) continue;

        if (media.type === 'photo' && isSafeHref(media.url)) return media.url;
        if (isSafeHref(media.preview_image_url)) return media.preview_image_url;
        if (isSafeHref(media.url)) return media.url;
    }

    return fallbackImage ?? '';
}
