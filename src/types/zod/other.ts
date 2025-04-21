import { z } from 'zod';

import { CobotAccessToken, CobotSpaceId, CobotSpaceSubdomain, CobotUserId } from '@/types/zod/cobotApi';

// Storage

export const FileSystemStorageFormat = z.record(z.unknown());
export type FileSystemStorageFormat = z.infer<typeof FileSystemStorageFormat>;

export const CobotSpaceSettings = z.object({
    accessToken: CobotAccessToken,
    spaceId: CobotSpaceId,
    spaceSubdomain: CobotSpaceSubdomain,

    resourceMapping: z.record(z.string()),
    pricePerKWh: z.number(),
});
export type CobotSpaceSettings = z.infer<typeof CobotSpaceSettings>;

export const CobotSpaceSettingsForUi = CobotSpaceSettings.omit({
    accessToken: true,
    spaceId: true,
    spaceSubdomain: true,
});
export type CobotSpaceSettingsForUi = z.infer<typeof CobotSpaceSettingsForUi>;

export const BookingStartComment = z.object({
    cobotUserIdStarted: CobotUserId,
    cobotMembershipId: z.string().nullable(),
    totalEnergyWattHoursStart: z.number(),
});
export type BookingStartComment = z.infer<typeof BookingStartComment>;

export const BookingEndComment = BookingStartComment.extend({
    cobotUserIdEnded: CobotUserId.nullable(),
    totalEnergyWattHoursEnd: z.number(),
    energyWattHoursUsed: z.number(),
    price: z.string(),
});
export type BookingEndComment = z.infer<typeof BookingEndComment>;

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
    cobotUserAccessToken: CobotAccessToken,
});
export type IframeToken = z.infer<typeof IframeToken>;

export const ExpectedIframeSearchParams = z.object({
    spaceId: CobotSpaceId,
    spaceSubdomain: CobotSpaceSubdomain,
    cobotUserId: CobotSpaceId,
    iframeToken: z.string(),
});
