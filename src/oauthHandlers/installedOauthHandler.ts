import {
    addSpaceNavigationLink,
    deleteSpaceNavigationLink,
    exchangeAccessTokenForSpaceToken,
    exchangeCodeForAccessToken,
    getSpaceDetails,
    getSpaceNavigationLinks,
    revokeAccessToken,
} from '@/api/cobot';
import { getCobotNavigationLinks } from '@/util';
import { spaceAccessTokenStore } from '@/storage';
import type { ValueOrError } from '@/types/util';
import type { CobotApiResponsePostNavigationLink, OauthStateInstall } from '@/types/zod';
import type { NextApiRequest, NextApiResponse } from 'next';
import { COBOT_CLIENT_ID } from '../env';

export default async (
    code: string,
    { spaceSubdomain }: OauthStateInstall,
    req: NextApiRequest,
    res: NextApiResponse<ValueOrError<void>>,
) => {
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

    // exchange for instance token immediately
    const accessToken = accessTokenExchangeResult.value.access_token;

    const spaceAccessTokenResult = await exchangeAccessTokenForSpaceToken(accessToken, spaceId);
    if (!spaceAccessTokenResult.ok) {
        // This is already sanitized
        res.status(400).send(spaceAccessTokenResult);
        return;
    }
    if (spaceAccessTokenResult.value.client_id !== COBOT_CLIENT_ID) {
        res.status(400).send({ ok: false, error: 'Invalid client ID' });
        return;
    }
    const spaceAccessToken = spaceAccessTokenResult.value.token;

    // revoke original access token
    const revokeAccessTokenResult = await revokeAccessToken(accessToken);
    if (!revokeAccessTokenResult.ok) {
        res.status(400).send(revokeAccessTokenResult);
        return;
    }

    const spaceTokenSetResult = await spaceAccessTokenStore.set({
        spaceId,
        accessToken: spaceAccessToken,
    });
    if (!spaceTokenSetResult.ok) {
        res.status(500).send(spaceTokenSetResult);
        return;
    }

    const existingNavigationLinksResult = await getSpaceNavigationLinks(spaceAccessToken, spaceSubdomain);
    if (!existingNavigationLinksResult.ok) {
        res.status(500).send(existingNavigationLinksResult);
        return;
    }
    const navigationLinksToAddResult = getCobotNavigationLinks(req);
    if (!navigationLinksToAddResult.ok) {
        res.status(500).send(navigationLinksToAddResult);
        return;
    }

    let firstNavigationLinkResult: CobotApiResponsePostNavigationLink | undefined =
        existingNavigationLinksResult.value.find(
            ({ section, label, iframe_url }) =>
                navigationLinksToAddResult.value[0].section === section &&
                navigationLinksToAddResult.value[0].label === label &&
                navigationLinksToAddResult.value[0].iframe_url === iframe_url,
        );

    const navigationLinksToDelete: string[] = [];
    const navigationLinksToAdd = [...navigationLinksToAddResult.value];

    for (const existingNavigationLink of existingNavigationLinksResult.value) {
        const foundNewNavigationLinkIndex = navigationLinksToAdd.findIndex(
            ({ section, label, iframe_url }) =>
                existingNavigationLink.section === section &&
                existingNavigationLink.label === label &&
                existingNavigationLink.iframe_url === iframe_url,
        );
        if (foundNewNavigationLinkIndex === -1) {
            // not found, needs to be deleted
            navigationLinksToDelete.push(existingNavigationLink.url);
        } else {
            // found, no need to add again
            navigationLinksToAdd.splice(foundNewNavigationLinkIndex, 1);
        }
    }

    // do it
    for (const navigationLinkToDelete of navigationLinksToDelete) {
        const result = await deleteSpaceNavigationLink(spaceAccessToken, navigationLinkToDelete);
        if (!result.ok) {
            res.status(500).send(result);
            return;
        }
    }
    for (const navigationLinkToAdd of navigationLinksToAdd) {
        const result = await addSpaceNavigationLink(spaceAccessToken, spaceSubdomain, navigationLinkToAdd);
        if (!result.ok) {
            res.status(500).send(result);
            return;
        }
        if (firstNavigationLinkResult === undefined) {
            firstNavigationLinkResult = result.value;
        }
    }

    let rediretUrl;
    if (firstNavigationLinkResult === undefined) {
        console.log('First navigation link URL user URL not found, redirecting to space');
        rediretUrl = `https://${encodeURIComponent(spaceSubdomain)}.cobot.me`;
    } else {
        console.log('Redirecting admin to first navigation link');
        rediretUrl = firstNavigationLinkResult.user_url;
    }
    res.redirect(rediretUrl);
};
