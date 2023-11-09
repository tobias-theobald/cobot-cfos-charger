import { COBOT_CLIENT_ID } from '@/env';
import { z } from 'zod';

// Cobot Types
export const CobotAccessToken = z.string().min(1).max(500);

export const CobotSpaceSubdomain = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export type CobotSpaceSubdomain = z.infer<typeof CobotSpaceSubdomain>;

export const CobotSpaceId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export type CobotSpaceId = z.infer<typeof CobotSpaceId>;

export const CobotUserId = z.string().min(1).max(500);

export const CobotNavigationLinkSection = z.enum(['admin/setup', 'admin/manage', 'admin/analyze', 'members']);

// Cobot API Responses

// https://dev.cobot.me/api-docs/oauth-flow
export const CobotApiResponsePostOauthAccessToken = z.object({
    access_token: CobotAccessToken,
    token_type: z.literal('bearer'),
});

// https://dev.cobot.me/api-docs/access-tokens#create-access-token-for-a-space
export const CobotApiResponsePostOauthSpaceAccessToken = z.object({
    token: CobotAccessToken,
    client_id: z.literal(COBOT_CLIENT_ID),
    scope: z.array(z.string()),
});

// https://dev.cobot.me/api-docs/spaces#get-space-details
export const CobotApiResponseGetSpaceDetails = z.object({
    created_at: z.string(),
    name: z.string(),
    id: z.string(),
    url: z.string().url(),
    email: z.string().email(),
    description: z.string().nullable(),
    owner_id: z.string(),
    subdomain: CobotSpaceSubdomain,
    tax_rate: z.number(),
    price_display: z.string(),
    price_decimals: z.number(),
    country: z.string(),
    locale: z.string(),
    in_eu: z.boolean(),
    time_zone_name: z.string(),
    time_zone_offset: z.number(),
    hour_format: z.number(),
});

// https://dev.cobot.me/api-docs/navigation-links#list-navigation-links
export const CobotApiResponsePostNavigationLink = z.object({
    section: CobotNavigationLinkSection,
    label: z.string(),
    iframe_url: z.string().url(),
    url: z.string().url(),
    user_url: z.string().url(),
});
export type CobotApiResponsePostNavigationLink = z.infer<typeof CobotApiResponsePostNavigationLink>;

export const CobotApiResponseGetNavigationLinks = z.array(CobotApiResponsePostNavigationLink);
export const CobotApiRequestPostNavigationLinkBody = CobotApiResponsePostNavigationLink.pick({
    section: true,
    label: true,
    iframe_url: true,
});
export type CobotApiRequestPostNavigationLinkBody = z.infer<typeof CobotApiRequestPostNavigationLinkBody>;

// Storage

export const FileSystemStorageFormat = z.record(z.unknown());
export type FileSystemStorageFormat = z.infer<typeof FileSystemStorageFormat>;

export const CobotSpaceAccessToken = z.object({
    accessToken: CobotAccessToken,
    spaceId: CobotSpaceId,
});
export type CobotSpaceAccessToken = z.infer<typeof CobotSpaceAccessToken>;

// Sealed

export const OauthStateInstall = z.object({
    type: z.literal('install'),
    spaceSubdomain: CobotSpaceSubdomain,
});
export type OauthStateInstall = z.infer<typeof OauthStateInstall>;

export const OauthStateUser = z.object({
    type: z.literal('user'),
    spaceId: CobotSpaceId,
    spaceSubdomain: CobotSpaceSubdomain,
    cobotUserId: CobotUserId,
    iframePath: z.string(),
});
export type OauthStateUser = z.infer<typeof OauthStateUser>;

export const OauthState = OauthStateInstall.or(OauthStateUser);
export type OauthState = z.infer<typeof OauthState>;

export const IframeToken = z.object({
    spaceId: CobotSpaceId,
    spaceSubdomain: CobotSpaceSubdomain,
    cobotUserId: CobotUserId,
    cobotAccessToken: CobotAccessToken,
});
export type IframeToken = z.infer<typeof IframeToken>;
