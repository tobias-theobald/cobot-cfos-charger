import { DB_URI } from '@/env';

import { FileSystemKeyValueStorage } from './FileSystemKeyValueStorage';
import type { KeyValueStorageBase } from './KeyValueStorageBase';

let storageInstance: KeyValueStorageBase | undefined = undefined;
const parsedDbUri = new URL(DB_URI);

if (parsedDbUri.protocol === 'file:') {
    storageInstance = new FileSystemKeyValueStorage(DB_URI);
}

if (storageInstance === undefined) {
    throw new Error('Unsupported DB_URI protocol');
}

export default storageInstance as KeyValueStorageBase;
