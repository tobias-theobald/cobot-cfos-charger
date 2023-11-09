import { exchangeCodeForAccessToken } from '@/api/cobot';
import type { ValueOrError } from '@/types/util';
import type { OauthStateUser } from '@/types/zod';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (
    code: string,
    { spaceSubdomain, spaceId, cobotUserId, iframePath }: OauthStateUser,
    req: NextApiRequest,
    res: NextApiResponse<ValueOrError<void>>,
) => {
    const accessTokenExchangeResult = await exchangeCodeForAccessToken(code);
    if (!accessTokenExchangeResult.ok) {
        // This is already sanitized
        res.status(400).send(accessTokenExchangeResult);
        return;
    }

    // TODO fetch user info, check if they may in fact access the space from the state
    // TODO encode Iframe token
    // TODO redirect user to iframePath with the iframe token in the query string
    res.redirect(iframePath);
};
