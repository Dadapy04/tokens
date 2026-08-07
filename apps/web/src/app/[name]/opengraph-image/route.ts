import { getTokenSocialImageResponse } from '@/lib/token-social-image';

export async function GET(request: Request, ctx: { params: Promise<{ name: string }> }) {
    const { name } = await ctx.params;
    return await getTokenSocialImageResponse(request, name);
}
