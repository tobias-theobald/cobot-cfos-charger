import { COBOT_OAUTH_SCOPES } from '@/constants';
import { COBOT_CLIENT_ID } from '@/env';
import type { ValueOrError } from '@/types/util';
import { CobotSpaceSubdomain } from '@/types/zod';
import { getBaseUrl } from '@/util';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse<ValueOrError<never>>) {
    const { space: spaceUnparsed } = req.query;

    const spaceParseResult = CobotSpaceSubdomain.safeParse(spaceUnparsed);

    if (!spaceParseResult.success) {
        res.status(400).send({
            ok: false,
            error: 'space query parameter is missing or invalid. Expected is the subdomain of the space you want to install this into',
        });
        return;
    }
    const space = spaceParseResult.data;

    const baseUrlResult = getBaseUrl(req);
    if (!baseUrlResult.ok) {
        res.status(400).send(baseUrlResult);
        return;
    }

    const url = new URL(`https://${space}.cobot.me/oauth/authorize`);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', COBOT_CLIENT_ID);
    url.searchParams.append('redirect_uri', new URL('/api/oauth/callback', baseUrlResult.value).toString());
    url.searchParams.append('scope', COBOT_OAUTH_SCOPES.join(' '));
    url.searchParams.append('state', `install-${space}`); // TODO this is insecure, randomize it and connect it to a cookie in the browser

    res.redirect(url.toString());
}
