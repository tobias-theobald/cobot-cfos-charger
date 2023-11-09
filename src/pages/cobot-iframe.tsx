import { useEffect, useState } from 'react';
import { ExpectedIframeSearchParams } from '../types/zod';

export default function Home() {
    const [iframeToken, setIframeToken] = useState<string | null>(null);

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

    if (iframeToken === null) {
        return <div>Authenticating...</div>;
    }

    return (
        <>
            <main>Hi there, hello {iframeToken}</main>
        </>
    );
}

// TODO: add redirect to /api/oauth/init-user if no iframe token is passed in query parameter
