import type { ValueOrError } from '@/types/util';
import { logErrorAndReturnCleanMessage } from '@/util';
import type { ZodType } from 'zod';

export type FetchWithTypeCheckedJsonResponseParams<T> = {
    method: 'get' | 'post' | 'delete' | 'put' | 'head';
    url: string | URL;
    expectedType: ZodType<T> | null;
    accessToken?: string;
    basicAuth?: { username: string; password: string };
    body?: unknown | URLSearchParams | undefined;
    init?: RequestInit;
};
export async function fetchWithTypeCheckedJsonResponse<T = void>({
    method,
    url,
    expectedType,
    accessToken,
    basicAuth,
    body,
    init = {},
}: FetchWithTypeCheckedJsonResponseParams<T>): Promise<ValueOrError<T>> {
    const effectiveHeaders: Record<string, string> = { ...((init.headers as Record<string, string>) ?? {}) };
    const effectiveInit: RequestInit = {
        ...init,
        headers: effectiveHeaders,
        method,
    };
    if (body !== undefined) {
        if (body instanceof URLSearchParams) {
            effectiveInit.body = body.toString();
            effectiveHeaders['content-type'] ??= 'application/x-www-form-urlencoded';
        } else {
            effectiveInit.body = JSON.stringify(body);
            effectiveHeaders['content-type'] ??= 'application/json';
        }
    }
    if (accessToken !== undefined) {
        effectiveHeaders['authorization'] = `Bearer ${accessToken}`;
    } else if (basicAuth !== undefined) {
        const { username, password } = basicAuth;
        const value = Buffer.from(`${username}:${password}`).toString('base64');
        effectiveHeaders['authorization'] = `Basic ${value}`;
    }

    let fetchResult;
    try {
        fetchResult = await fetch(url, effectiveInit);
    } catch (e) {
        return logErrorAndReturnCleanMessage('network error', e);
    }

    if (expectedType === null) {
        if (fetchResult.status === 204 || fetchResult.status === 200) {
            return { ok: true, value: undefined as T };
        } else {
            return logErrorAndReturnCleanMessage('Expected response but none came');
        }
    }

    let fetchResultBodyText;
    try {
        fetchResultBodyText = await fetchResult.text();
    } catch (e) {
        return logErrorAndReturnCleanMessage('network error retrieving body', e);
    }

    if (!fetchResult.ok) {
        return logErrorAndReturnCleanMessage('HTTP error', fetchResult.status, fetchResultBodyText);
    }

    let fetchResultBodyJson;
    try {
        fetchResultBodyJson = JSON.parse(fetchResultBodyText);
    } catch (e) {
        return logErrorAndReturnCleanMessage('Parse error', e, fetchResultBodyText);
    }

    const parseResult = expectedType.safeParse(fetchResultBodyJson);
    if (!parseResult.success) {
        return logErrorAndReturnCleanMessage('Type check error', parseResult.error.stack);
    }
    return { ok: true, value: parseResult.data };
}
