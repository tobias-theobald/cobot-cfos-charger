import type { ZodType } from 'zod';
import type { KeyValueStorageBase } from './storage-layer/KeyValueStorageBase';
import type { ValueOrError } from '@/types/util';
import { logErrorAndReturnCleanMessage } from '@/util';

const OBJECT_KEY_SEPARATOR = '$$';
const SUBKEY_SEPARATOR = '$';

export class ObjectStore<K extends Record<string, unknown>, T extends K, D = T> {
    constructor(
        protected zodType: ZodType<T>,
        protected objectKeyPrefix: string,
        protected subkeyConstructor: (keyObject: K, separator: string) => string,
        protected keyValueStore: KeyValueStorageBase,
        protected defaultValue: T | D,
    ) {}

    protected getFullKey(keyObject: K): ValueOrError<string> {
        try {
            return {
                ok: true,
                value: `${this.objectKeyPrefix}${OBJECT_KEY_SEPARATOR}${this.subkeyConstructor(
                    keyObject,
                    SUBKEY_SEPARATOR,
                )}`,
            };
        } catch (e) {
            return logErrorAndReturnCleanMessage('Error generating key', e);
        }
    }

    async get(keyObject: K): Promise<ValueOrError<T | D>> {
        const key = this.getFullKey(keyObject);
        if (!key.ok) {
            return key;
        }

        let valueUnparsed;
        try {
            valueUnparsed = await this.keyValueStore.get(key.value);
        } catch (e) {
            return logErrorAndReturnCleanMessage('Error getting data from storage', e);
        }
        if (valueUnparsed === undefined) {
            return JSON.parse(JSON.stringify(this.defaultValue));
        }
        const valueParseResult = this.zodType.safeParse(valueUnparsed);
        if (!valueParseResult.success) {
            return logErrorAndReturnCleanMessage('Error parsing data in storage', valueParseResult.error.format());
        }
        return { ok: true, value: valueParseResult.data };
    }

    async set(value: T): Promise<ValueOrError<void>> {
        const key = this.getFullKey(value);
        if (!key.ok) {
            return key;
        }
        const valueParseResult = this.zodType.safeParse(value);
        if (!valueParseResult.success) {
            return logErrorAndReturnCleanMessage(
                'Error parsing data to be written to storage',
                valueParseResult.error.format(),
            );
        }
        try {
            await this.keyValueStore.set(key.value, value);
        } catch (e) {
            return logErrorAndReturnCleanMessage('Error saving value in DB', e);
        }
        return { ok: true, value: undefined };
    }

    async delete(keyObject: K): Promise<ValueOrError<void>> {
        const key = this.getFullKey(keyObject);
        if (!key.ok) {
            return key;
        }

        try {
            await this.keyValueStore.delete(key.value);
        } catch (e) {
            return logErrorAndReturnCleanMessage('Error deleting value in DB', e);
        }
        return { ok: true, value: undefined };
    }
}
