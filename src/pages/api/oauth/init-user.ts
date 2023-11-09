import { COBOT_OAUTH_USER_SCOPES, COBOT_NAVIGATION_ITEMS } from '@/constants';
import { COBOT_CLIENT_ID } from '@/env';
import { sealOauthState } from '@/seals';
import type { ValueOrError } from '@/types/util';
import { CobotSpaceId, CobotSpaceSubdomain, CobotUserId } from '@/types/zod';
import { getBaseUrl } from '@/util';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const VerifiableQueryParameters = z.object({
    spaceId: CobotSpaceId,
    spaceSubdomain: CobotSpaceSubdomain,
    cobotUserId: CobotUserId,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse<ValueOrError<never>>) {
    const verifiableQueryParamsParseResult = VerifiableQueryParameters.safeParse(req.query);
    if (!verifiableQueryParamsParseResult.success) {
        console.error('VerifiableQueryParameters failed to parse', verifiableQueryParamsParseResult.error.format());
        res.status(400).send({
            ok: false,
            error: 'A required query parameter is missing or invalid',
        });
        return;
    }
    const { spaceId, spaceSubdomain, cobotUserId } = verifiableQueryParamsParseResult.data;

    const { iframePath: iframePathUnparsed } = req.query;
    if (
        typeof iframePathUnparsed !== 'string' ||
        COBOT_NAVIGATION_ITEMS.find(({ iframe_url }) => iframe_url === iframePathUnparsed) === undefined
    ) {
        res.status(400).send({
            ok: false,
            error: 'iframePath unknown',
        });
        return;
    }
    const iframePath = iframePathUnparsed;

    const baseUrlResult = getBaseUrl(req);
    if (!baseUrlResult.ok) {
        res.status(400).send(baseUrlResult);
        return;
    }

    const sealStateResult = await sealOauthState({
        type: 'user',
        spaceId,
        spaceSubdomain,
        cobotUserId,
        iframePath,
    });
    if (!sealStateResult.ok) {
        res.status(400).send(sealStateResult);
        return;
    }

    const url = new URL(`https://${spaceSubdomain}.cobot.me/oauth/authorize`);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', COBOT_CLIENT_ID);
    url.searchParams.append('redirect_uri', new URL('/api/oauth/callback', baseUrlResult.value).toString());
    url.searchParams.append('scope', COBOT_OAUTH_USER_SCOPES.join(' '));
    url.searchParams.append('state', sealStateResult.value);

    res.redirect(url.toString());
}
