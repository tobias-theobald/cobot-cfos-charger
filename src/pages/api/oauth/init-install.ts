import { COBOT_OAUTH_ADMIN_SCOPES } from '@/constants';
import { COBOT_CLIENT_ID } from '@/env';
import { sealOauthState } from '@/seals';
import type { ValueOrError } from '@/types/util';
import { CobotSpaceSubdomain } from '@/types/zod';
import { getBaseUrl } from '@/util';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ValueOrError<never>>) {
    const { spaceSubdomain: spaceSubdomainUnparsed } = req.query;

    const spaceSubdomainParseResult = CobotSpaceSubdomain.safeParse(spaceSubdomainUnparsed);

    if (!spaceSubdomainParseResult.success) {
        res.status(400).send({
            ok: false,
            error: 'spaceSubdomain query parameter is missing or invalid. Expected is the subdomain of the space you want to install this into',
        });
        return;
    }
    const spaceSubdomain = spaceSubdomainParseResult.data;

    const baseUrlResult = getBaseUrl(req);
    if (!baseUrlResult.ok) {
        res.status(400).send(baseUrlResult);
        return;
    }

    const sealStateResult = await sealOauthState({ type: 'install', spaceSubdomain });
    if (!sealStateResult.ok) {
        res.status(500).send(sealStateResult);
        return;
    }

    const url = new URL(`https://${spaceSubdomain}.cobot.me/oauth/authorize`);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', COBOT_CLIENT_ID);
    url.searchParams.append('redirect_uri', new URL('/api/oauth/callback', baseUrlResult.value).toString());
    url.searchParams.append('scope', COBOT_OAUTH_ADMIN_SCOPES.join(' '));
    url.searchParams.append('state', sealStateResult.value);

    res.redirect(url.toString());
}
