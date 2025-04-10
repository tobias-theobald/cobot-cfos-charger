import type { SealOptions } from '@hapi/iron';
import { defaults, seal as ironSeal, unseal as ironUnseal } from '@hapi/iron';
import type { ZodType } from 'zod';

import { IRON_PASSWORD } from './env';
import type { ValueOrError } from './types/util';
import { IframeToken, OauthState } from './types/zod/other';
import { logErrorAndReturnCleanMessage } from './util';

const optionsOauthState = { ...defaults, ttl: 15 * 60 * 1000 }; // 15 min
const optionsIframeToken = { ...defaults, ttl: 12 * 60 * 60 * 1000 }; // 12h

const seal = async (obj: unknown, options: SealOptions): Promise<ValueOrError<string>> => {
    try {
        const sealed = await ironSeal(obj, IRON_PASSWORD, options);
        return { ok: true, value: sealed };
    } catch (err) {
        return logErrorAndReturnCleanMessage('Error creating seal', err);
    }
};

export const sealOauthState = (obj: OauthState) => seal(obj, optionsOauthState);
export const sealIframeToken = (obj: IframeToken) => seal(obj, optionsIframeToken);

const unseal = async <T>(sealed: string, options: SealOptions, expectedType: ZodType<T>): Promise<ValueOrError<T>> => {
    let unsealed;
    try {
        unsealed = await ironUnseal(sealed, IRON_PASSWORD, options);
    } catch (err) {
        return logErrorAndReturnCleanMessage('Error unsealing', err);
    }
    const parseResult = expectedType.safeParse(unsealed);
    if (!parseResult.success) {
        return logErrorAndReturnCleanMessage('Error validating type of sealed message', parseResult.error.format());
    }
    return { ok: true, value: parseResult.data };
};

export const unsealOauthState = (sealed: string) => unseal(sealed, optionsOauthState, OauthState);
export const unsealIframeToken = (sealed: string) => unseal(sealed, optionsIframeToken, IframeToken);
