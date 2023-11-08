import { CobotInstanceAccessToken, type CobotSpaceSubdomain } from '@/types/zod';
import { ObjectStore } from './ObjectStore';
import keyValueStoreInstance from './storage-layer';

export const instanceAccessTokenStore = new ObjectStore(
    CobotInstanceAccessToken,
    'CobotInstanceAccessToken',
    ({ spaceSubdomain }: { spaceSubdomain: CobotSpaceSubdomain }) => spaceSubdomain,
    keyValueStoreInstance,
    null,
);
