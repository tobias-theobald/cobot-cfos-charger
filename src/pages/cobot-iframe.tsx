import { useCallback, useEffect, useState } from 'react';
import { trpc } from '../trpc-client';
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

    const cobotUserIdQuery = trpc.getCobotUserId.useQuery(undefined, { enabled: iframeToken !== null });
    const generateGreeting = trpc.generateGreeting.useMutation();

    const doGenerateGreeting = useCallback(() => {
        generateGreeting.mutate({ name: 'John Doe' });
    }, [generateGreeting]);

    if (iframeToken === null) {
        return <div>Authenticating...</div>;
    }

    return (
        <>
            <main>
                <div>Hi there, hello</div>
                <div>IFrame Token: {iframeToken}</div>
                <div>cobotUserId: {cobotUserIdQuery.status} </div>
                <pre>{JSON.stringify(cobotUserIdQuery.data ?? cobotUserIdQuery.error, null, 2)}</pre>
                <div>greeting: {generateGreeting.status}</div>
                <button type="button" onClick={doGenerateGreeting}>
                    Generate greeting
                </button>
                <pre>{JSON.stringify(generateGreeting.data ?? generateGreeting.error, null, 2)}</pre>
            </main>
        </>
    );
}

// TODO: add redirect to /api/oauth/init-user if no iframe token is passed in query parameter
