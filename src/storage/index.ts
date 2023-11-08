import type { CobotSpaceId } from '@/types/zod';
import { CobotSpaceAccessToken } from '@/types/zod';
import { ObjectStore } from './ObjectStore';
import keyValueStoreInstance from './storage-layer';

export const spaceAccessTokenStore = new ObjectStore(
    CobotSpaceAccessToken,
    'CobotSpaceAccessToken',
    ({ spaceId }: { spaceId: CobotSpaceId }) => spaceId,
    keyValueStoreInstance,
    null,
);
