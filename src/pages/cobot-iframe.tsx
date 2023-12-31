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

    const getWallboxStatusQuery = trpc.getWallboxStatus.useQuery(undefined, {
        enabled: iframeToken !== null,
        refetchInterval: 3000,
    });
    const authorizeWallboxMutation = trpc.authorizeWallbox.useMutation();

    if (iframeToken === null) {
        return <div>Authenticating...</div>;
    }

    return (
        <>
            <main>
                <div>Hi there, hello</div>
                <pre>{JSON.stringify(getWallboxStatusQuery.data ?? getWallboxStatusQuery.error, null, 2)}</pre>
                <div>Set Charging State Mutation: {authorizeWallboxMutation.status}</div>
                {getWallboxStatusQuery.data?.map((device) => (
                    <div key={device.id}>
                        <button
                            type="button"
                            disabled={!device.chargingEnabled && device.evseWallboxState !== 'vehiclePresent'}
                            onClick={() => {
                                authorizeWallboxMutation.mutate({
                                    id: device.id,
                                });
                            }}
                        >
                            Authorize {device.friendlyName} ({device.id})
                        </button>
                    </div>
                ))}
            </main>
        </>
    );
}
