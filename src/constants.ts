import type { NextApiRequest } from 'next';
import type { CobotApiRequestPostNavigationLinkBody } from './types/zod';
import { getBaseUrl } from './util';
import type { ValueOrError } from './types/util';

export const COBOT_OAUTH_SCOPES = ['navigation', 'write_charges', 'read_user'];

export const getCobotNavigationLinks = (req: NextApiRequest): ValueOrError<CobotApiRequestPostNavigationLinkBody[]> => {
    const baseUrlResult = getBaseUrl(req);
    if (!baseUrlResult.ok) {
        return baseUrlResult;
    }
    return {
        ok: true,
        value: [
            {
                section: 'members',
                label: 'My App Iframe',
                iframe_url: new URL('/cobot-iframe', baseUrlResult.value).toString(),
            },
        ],
    };
};
