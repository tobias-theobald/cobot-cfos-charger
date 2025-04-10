import type { NextApiRequest, NextApiResponse } from 'next';

import { exchangeCodeForAccessToken, getSpaceDetails, getUserDetails } from '@/api/cobot';
import { sealIframeToken } from '@/seals';
import type { ValueOrError } from '@/types/util';
import type { IframeToken, OauthStateUser } from '@/types/zod/other';

export default async (
    code: string,
    { spaceSubdomain, iframePath }: OauthStateUser,
    req: NextApiRequest,
    res: NextApiResponse<ValueOrError<void>>,
) => {
    console.log('Initiating user OAuth callback', req.query);

    // fetch space details for space id
    const spaceDetailsResult = await getSpaceDetails(spaceSubdomain);
    if (!spaceDetailsResult.ok) {
        res.status(400).send(spaceDetailsResult);
        return;
    }
    const spaceId = spaceDetailsResult.value.id;

    const accessTokenExchangeResult = await exchangeCodeForAccessToken(code);
    if (!accessTokenExchangeResult.ok) {
        // This is already sanitized
        res.status(400).send(accessTokenExchangeResult);
        return;
    }
    const accessToken = accessTokenExchangeResult.value.access_token;

    const userInfo = await getUserDetails(accessToken);
    if (!userInfo.ok) {
        res.status(400).send(userInfo);
        return;
    }
    const spaceMembership = userInfo.value.memberships.find(
        ({ space_subdomain }) => space_subdomain === spaceSubdomain,
    );
    if (spaceMembership === undefined) {
        res.status(403).send({
            ok: false,
            error: 'User is not a member of the space',
        });
        return;
    }
    const cobotUserId = userInfo.value.id;

    // encode Iframe token
    const iframeTokenObj: IframeToken = {
        spaceId,
        cobotUserId,
        spaceSubdomain,
        cobotUserAccessToken: accessTokenExchangeResult.value.access_token,
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
