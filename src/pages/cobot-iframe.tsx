import { useEffect, useState } from 'react';

import IframeAdmin from '@/components/IframeAdmin';
import { ExpectedIframeSearchParams } from '@/types/zod/other';

export default function Home() {
    // Cannot use initializer function here because it relies on window which is not available in SSR
    const [iframeToken, setIframeToken] = useState<string | null>(null);
    const [resizeObserver, setResizeObserver] = useState<ResizeObserver | null>(null);

    useEffect(() => {
        if (iframeToken !== null) {
            return;
        }
        const searchParams = new URLSearchParams(window.document.location.search);
        const searchParamsParseResult = ExpectedIframeSearchParams.safeParse(
            Object.fromEntries(searchParams.entries()),
        );
        if (!searchParamsParseResult.success) {
            searchParams.set('iframePath', window.document.location.pathname);
            // redirect
            window.location.href = '/api/oauth/init-user?' + searchParams.toString();
            return;
        }
        setIframeToken(searchParamsParseResult.data.iframeToken);
    }, [iframeToken]);

    useEffect(() => {
        let observer: ResizeObserver | null = resizeObserver;
        if (observer === null) {
            observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === document.body) {
                        const height = entry.contentRect.height;
                        window.parent.postMessage(JSON.stringify({ frameHeight: height }), '*');
                    }
                }
            });
            setResizeObserver(observer);
        }
        observer.observe(document.body);
        return () => {
            if (observer !== null) {
                observer.unobserve(document.body);
            }
        };
    }, [resizeObserver]);

    if (iframeToken === null) {
        return <div>Authenticating...</div>;
    }

    return <IframeAdmin />;
}
