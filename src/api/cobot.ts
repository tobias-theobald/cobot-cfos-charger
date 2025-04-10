import { COBOT_CLIENT_ID, COBOT_CLIENT_SECRET } from '@/env';
import {
    type CobotApiRequestPostNavigationLinkBody,
    CobotApiResponseGetMemberships,
    CobotApiResponseGetUserDetails,
} from '@/types/zod';
import {
    CobotApiResponseGetNavigationLinks,
    CobotApiResponseGetSpaceDetails,
    CobotApiResponsePostNavigationLink,
    CobotApiResponsePostOauthAccessToken,
    CobotApiResponsePostOauthSpaceAccessToken,
} from '@/types/zod';

import { fetchWithTypeCheckedJsonResponse } from './base';

// https://dev.cobot.me/api-docs/oauth-flow
export const exchangeCodeForAccessToken = async (code: string) => {
    const body = new URLSearchParams();
    body.set('client_id', COBOT_CLIENT_ID);
    body.set('client_secret', COBOT_CLIENT_SECRET);
    body.set('grant_type', 'authorization_code');
    body.set('code', code);

    console.log('Exchanging code for access token');
    return fetchWithTypeCheckedJsonResponse({
        url: 'https://www.cobot.me/oauth/access_token',
        method: 'post',
        body,
        expectedType: CobotApiResponsePostOauthAccessToken,
    });
};

// https://dev.cobot.me/api-docs/spaces#get-space-details
export const getSpaceDetails = async (spaceSubdomain: string) => {
    console.log('Getting space details');
    return fetchWithTypeCheckedJsonResponse({
        url: `https://www.cobot.me/api/spaces/${spaceSubdomain}`,
        method: 'get',
        expectedType: CobotApiResponseGetSpaceDetails,
    });
};

// https://dev.cobot.me/api-docs/access-tokens#create-access-token-for-a-space
export const exchangeAccessTokenForSpaceToken = async (accessToken: string, spaceId: string) => {
    const body = {
        space_id: spaceId,
    };

    console.log('Exchanging access token for space token');
    return fetchWithTypeCheckedJsonResponse({
        url: `https://www.cobot.me/api/access_tokens/${accessToken}/space`,
        method: 'post',
        accessToken,
        body,
        expectedType: CobotApiResponsePostOauthSpaceAccessToken,
    });
};

// https://dev.cobot.me/api-docs/access-tokens#revoke-access-token
export const revokeAccessToken = async (accessToken: string) => {
    console.log('Revoking access token');
    return fetchWithTypeCheckedJsonResponse({
        url: `https://www.cobot.me/api/access_tokens/${accessToken}`,
        method: 'delete',
        accessToken,
        expectedType: null,
    });
};

// https://dev.cobot.me/api-docs/users#get-user-details
export const getUserDetails = async (accessToken: string) => {
    console.log('Fetching user details for current user');

    return fetchWithTypeCheckedJsonResponse({
        url: `https://www.cobot.me/api/user`,
        method: 'get',
        accessToken,
        expectedType: CobotApiResponseGetUserDetails,
    });
};

// https://dev.cobot.me/api-docs/navigation-links#list-navigation-links
export const getSpaceNavigationLinks = async (accessToken: string, spaceSubdomain: string) => {
    console.log('Fetching registered navigation links');

    return fetchWithTypeCheckedJsonResponse({
        url: `https://${encodeURIComponent(spaceSubdomain)}.cobot.me/api/navigation_links`,
        method: 'get',
        accessToken,
        expectedType: CobotApiResponseGetNavigationLinks,
    });
};

// https://dev.cobot.me/api-docs/navigation-links#create-navigation-links
export const addSpaceNavigationLink = async (
    accessToken: string,
    spaceSubdomain: string,
    navigationLinkDefinition: CobotApiRequestPostNavigationLinkBody,
) => {
    console.log('Registering navigation link');

    return fetchWithTypeCheckedJsonResponse({
        url: `https://${encodeURIComponent(spaceSubdomain)}.cobot.me/api/navigation_links`,
        method: 'post',
        body: navigationLinkDefinition,
        accessToken,
        expectedType: CobotApiResponsePostNavigationLink,
    });
};

// https://dev.cobot.me/api-docs/navigation-links#delete-navigation-links
export const deleteSpaceNavigationLink = async (accessToken: string, navigationLinkUrl: string) => {
    console.log('Deleting registered navigation link');

    return fetchWithTypeCheckedJsonResponse({
        url: navigationLinkUrl,
        method: 'delete',
        accessToken,
        expectedType: null,
    });
};

// https://dev.cobot.me/api-docs/memberships#list-members
export const listMembershipsWithIdNameEmail = async (accessToken: string, spaceSubdomain: string) => {
    console.log('Listing memberships with id, name and email');

    return fetchWithTypeCheckedJsonResponse({
        url: `https://${encodeURIComponent(spaceSubdomain)}.cobot.me/api/memberships?${new URLSearchParams({ attributes: ['id', 'name', 'email'].join(',') })}`,
        method: 'get',
        accessToken,
        expectedType: CobotApiResponseGetMemberships,
    });
};
