import { COBOT_CLIENT_ID, COBOT_CLIENT_SECRET } from '@/env';
import { instanceAccessTokenStore } from '@/storage';
import type { ValueOrError } from '@/types/util';
import { CobotApiResponsePostOauthAccessToken } from '@/types/zod';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ValueOrError<void>>) {
    const { state, code } = req.query;
    if (typeof state !== 'string' || typeof code !== 'string' || state === '' || code === '') {
        res.status(400).send({
            ok: false,
            error: 'state and/or code query parameters are missing or invalid',
        });
        return;
    }

    // TODO add user auth here later
    const installStateMatch = state.match(/^install-([a-z][a-z0-9-]{0,99})$/);
    if (installStateMatch === null) {
        res.status(400).send({
            ok: false,
            error: 'state invalid',
        });
        return;
    }
    const space = installStateMatch[1];

    const body = new URLSearchParams();
    body.set('client_id', COBOT_CLIENT_ID);
    body.set('client_secret', COBOT_CLIENT_SECRET);
    body.set('grant_type', 'authorization_code');
    body.set('code', code);

    let accessTokenResult;
    try {
        accessTokenResult = await fetch('https://www.cobot.me/oauth/access_token', {
            method: 'post',
            body: body.toString(),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });
    } catch (e) {
        console.error('Error fetching oauth access token', e);
        res.status(400).send({
            ok: false,
            error: 'oauth token exchange network error',
        });
        return;
    }

    let accessTokenResultBodyText;
    try {
        accessTokenResultBodyText = await accessTokenResult.text();
    } catch (e) {
        console.error('Error fetching oauth access token body', e);
        res.status(400).send({
            ok: false,
            error: 'oauth token exchange network error retrieving body',
        });
        return;
    }

    if (!accessTokenResult.ok) {
        console.error('HTTP Error fetching oauth access token', accessTokenResult.status, accessTokenResultBodyText);
        res.status(400).send({
            ok: false,
            error: 'oauth token exchange HTTP error',
        });
        return;
    }

    let accessTokenResultBodyJson;
    try {
        accessTokenResultBodyJson = JSON.parse(accessTokenResultBodyText);
    } catch (e) {
        console.error('Parse error fetching oauth access token', accessTokenResult.status, accessTokenResultBodyText);
        res.status(400).send({
            ok: false,
            error: 'oauth token exchange parse error',
        });
        return;
    }

    const parseResult = CobotApiResponsePostOauthAccessToken.safeParse(accessTokenResultBodyJson);
    if (!parseResult.success) {
        console.error(
            'Zod parse error fetching oauth access token',
            accessTokenResultBodyText,
            parseResult.error.format(),
        );
        res.status(400).send({
            ok: false,
            error: 'oauth token exchange typecheck error',
        });
        return;
    }

    // TODO actually fetch an instance access token with this
    const accessToken = parseResult.data.access_token;
    const accessTokenSetResult = await instanceAccessTokenStore.set({ spaceSubdomain: space, accessToken });
    if (!accessTokenSetResult.ok) {
        console.error('Error storing instance access token', accessTokenSetResult.error);
        res.status(500).send({
            ok: false,
            error: 'Error storing instance access token',
        });
        return;
    }
    // TODO redirect user to a landing page or something
    res.status(200).send({ ok: true, value: undefined });
}
