import type { NextApiRequest, NextApiResponse } from 'next';

import installedOauthHandler from '@/oauthHandlers/installedOauthHandler';
import userOauthHandler from '@/oauthHandlers/userOauthHandler';
import { unsealOauthState } from '@/seals';
import type { ValueOrError } from '@/types/util';

export default async function handler(req: NextApiRequest, res: NextApiResponse<ValueOrError<void>>) {
    const { state, code } = req.query;
    if (typeof state !== 'string' || typeof code !== 'string' || state === '' || code === '') {
        res.status(400).send({
            ok: false,
            error: 'state and/or code query parameters are missing or invalid',
        });
        return;
    }

    const unsealedState = await unsealOauthState(state);
    if (!unsealedState.ok) {
        res.status(401).send(unsealedState);
        return;
    }
    const stateObj = unsealedState.value;

    if (stateObj.type === 'install') {
        await installedOauthHandler(code, stateObj, req, res);
        return;
    }

    if (stateObj.type === 'user') {
        await userOauthHandler(code, stateObj, req, res);
        return;
    }

    res.status(400).send({
        ok: false,
        error: 'state invalid',
    });
}
