import { exchangeCodeForAccessToken } from '@/api/cobot';
import type { ValueOrError } from '@/types/util';
import type { IframeToken, OauthStateUser } from '@/types/zod';
import type { NextApiRequest, NextApiResponse } from 'next';
import { sealIframeToken } from '../seals';

export default async (
    code: string,
    { spaceSubdomain, spaceId, cobotUserId, iframePath }: OauthStateUser,
    req: NextApiRequest,
    res: NextApiResponse<ValueOrError<void>>,
) => {
    console.log('Initiating user OAuth callback', req.query);
    const accessTokenExchangeResult = await exchangeCodeForAccessToken(code);
    if (!accessTokenExchangeResult.ok) {
        // This is already sanitized
        res.status(400).send(accessTokenExchangeResult);
        return;
    }

    // TODO fetch user info, check if they may in fact access the space from the state

    // encode Iframe token
    const iframeTokenObj: IframeToken = {
        spaceId,
        cobotUserId,
        spaceSubdomain,
        cobotAccessToken: accessTokenExchangeResult.value.access_token,
    };
    const sealedIframeTokenResult = await sealIframeToken(iframeTokenObj);

    if (!sealedIframeTokenResult.ok) {
        res.status(500).send(sealedIframeTokenResult);
        return;
    }
    const searchParams = new URLSearchParams({
        spaceSubdomain,
        spaceId,
        cobotUserId,
        iframeToken: sealedIframeTokenResult.value,
    });

    // console.log('Redirecting to', `${iframePath}?${searchParams.toString()}`);
    res.redirect(`${iframePath}?${searchParams.toString()}`);
};
