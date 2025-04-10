import type { CobotSpaceId } from '@/types/zod/cobotApi';
import { CobotSpaceSettings } from '@/types/zod/other';

import { ObjectStore } from './ObjectStore';
import keyValueStoreInstance from './storage-layer';

export const spaceSettingsStore = new ObjectStore(
    CobotSpaceSettings,
    'CobotSpaceSettings',
    ({ spaceId }: { spaceId: CobotSpaceId }) => spaceId,
    keyValueStoreInstance,
    null,
);
