import installedOauthHandler from '@/oauthHandlers/installedOauthHandler';
import type { ValueOrError } from '@/types/util';
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

    const installStateMatch = state.match(/^install-([a-z][a-z0-9-]{0,99})$/);
    if (installStateMatch !== null) {
        const space = installStateMatch[1];
        await installedOauthHandler(code, space, req, res);
        return;
    }

    // TODO add user auth here later

    res.status(400).send({
        ok: false,
        error: 'state invalid',
    });
}
