import type { NextApiRequest } from 'next';

import { COBOT_NAVIGATION_ITEMS } from './constants';
import type { ValueOrError } from './types/util';
import type { CobotApiRequestPostNavigationLinkBody } from './types/zod';

export const logErrorAndReturnCleanMessage = (
    cleanMessage: string,
    ...error: unknown[]
): { ok: false; error: string } => {
    console.error(cleanMessage, ...error);
    return { ok: false, error: cleanMessage };
};

export const deepCopy = (arg: unknown) => JSON.parse(JSON.stringify(arg));

export const getBaseUrl = (req: NextApiRequest): ValueOrError<URL> => {
    const hostHeader = req.headers.host;
    const hostProto = req.headers['x-forwarded-proto'] ?? 'http';

    if (hostHeader === undefined || hostHeader.length === 0) {
        return logErrorAndReturnCleanMessage('host header missing', req.headers);
    }
    if (hostProto !== 'https' && hostProto !== 'http') {
        return logErrorAndReturnCleanMessage('host proto missing or invalid', req.headers);
    }

    return { ok: true, value: new URL(`${hostProto}://${hostHeader}`) };
};

export const getCobotNavigationLinks = (req: NextApiRequest): ValueOrError<CobotApiRequestPostNavigationLinkBody[]> => {
    const baseUrlResult = getBaseUrl(req);
    if (!baseUrlResult.ok) {
        return baseUrlResult;
    }
    return {
        ok: true,
        value: COBOT_NAVIGATION_ITEMS.map(({ iframe_url, ...remainder }) => ({
            iframe_url: new URL(iframe_url, baseUrlResult.value).toString(),
            ...remainder,
        })) as CobotApiRequestPostNavigationLinkBody[],
    };
};
