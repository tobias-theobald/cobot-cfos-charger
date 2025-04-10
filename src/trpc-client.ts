import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';

import type { AppRouter } from './trpc-server';

function getBaseUrl() {
    if (typeof window !== 'undefined') {
        // browser should use relative path
        return '';
    }

    // assume localhost
    return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCNext<AppRouter>({
    config(opts) {
        return {
            links: [
                httpBatchLink({
                    /**
                     * If you want to use SSR, you need to use the server's full URL
                     * @link https://trpc.io/docs/ssr
                     **/
                    url: `${getBaseUrl()}/api/trpc`,

                    // You can pass any HTTP headers you wish here
                    async headers() {
                        let iframeToken: string | string[] | undefined = opts.ctx?.query?.iframeToken;
                        if (iframeToken === undefined && typeof window !== 'undefined') {
                            iframeToken = new URLSearchParams(window.location.search).get('iframeToken') ?? undefined;
                        }
                        if (iframeToken === undefined || (Array.isArray(iframeToken) && iframeToken.length === 0)) {
                            throw new Error('iframeToken is undefined');
                        }
                        return {
                            authorization: `bearer ${Array.isArray(iframeToken) ? iframeToken[0] : iframeToken}`,
                        };
                    },
                }),
            ],
        };
    },
    /**
     * @link https://trpc.io/docs/ssr
     **/
    ssr: false,
});
