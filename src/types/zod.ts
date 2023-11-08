import { z } from 'zod';

// Cobot Types
export const CobotAccessToken = z.string().min(1).max(500);
export const CobotSpaceSubdomain = z.string().regex(/^[a-z0-9][a-z0-9-]{0,99}$/);
export type CobotSpaceSubdomain = z.infer<typeof CobotSpaceSubdomain>;

// Cobot API Responses

export const CobotApiResponsePostOauthAccessToken = z.object({
    access_token: CobotAccessToken,
    token_type: z.literal('bearer'),
});

// Storage

export const FileSystemStorageFormat = z.record(z.unknown());
export type FileSystemStorageFormat = z.infer<typeof FileSystemStorageFormat>;

export const CobotInstanceAccessToken = z.object({
    accessToken: CobotAccessToken,
    spaceSubdomain: CobotSpaceSubdomain,
});
export type CobotInstanceAccessToken = z.infer<typeof CobotInstanceAccessToken>;
