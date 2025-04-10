import { Settings as SettingsIcon } from '@mui/icons-material';
import { Box, Button, Grid } from '@mui/material';
import { useCallback, useState } from 'react';

import ChargerCard from '@/components/ChargerCard';
import { trpc } from '@/trpc-client';

export default function IframeAdmin() {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const getWallboxStatusQuery = trpc.getWallboxStatus.useQuery(undefined, {
        refetchInterval: 3000,
    });
    const startChargingMutation = trpc.startCharging.useMutation();
    const stopChargingMutation = trpc.stopCharging.useMutation();
    const getMembershipsQuery = trpc.getMemberships.useQuery(undefined, {
        // This API is heavily rate-limited and unlikely to change much, so we can cache it until the user reloads, probably
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchOnMount: false,
    });

    const handleStartCharging = useCallback(
        (chargerId: string, membershipId: string) => {
            startChargingMutation.mutate({ chargerId, membershipId });
        },
        [startChargingMutation],
    );

    const handleStopCharging = useCallback(
        (chargerId: string) => {
            stopChargingMutation.mutate({ chargerId });
        },
        [stopChargingMutation],
    );

    return (
        <>
            <Box sx={{ flexGrow: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setSettingsOpen(true)}>
                        Settings
                    </Button>
                </Box>

                {getWallboxStatusQuery.data && getMembershipsQuery.data ? (
                    <Grid container spacing={3}>
                        {getWallboxStatusQuery.data.map((charger) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={charger.id}>
                                <ChargerCard
                                    charger={charger}
                                    memberships={getMembershipsQuery.data}
                                    onStartCharging={handleStartCharging}
                                    onStopCharging={handleStopCharging}
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <>Loading...</>
                )}
            </Box>

            {/*TODO: Add settings modal*/}
            {/*<SettingsDialog*/}
            {/*    open={settingsOpen}*/}
            {/*    onClose={() => setSettingsOpen(false)}*/}
            {/*    settings={settings}*/}
            {/*    accountingCodes={mockAccountingCodes}*/}
            {/*    onSaveSettings={handleSaveSettings}*/}
            {/*/>*/}

            {/*<main>*/}
            {/*    <pre>{JSON.stringify(getWallboxStatusQuery.data ?? getWallboxStatusQuery.error, null, 2)}</pre>*/}
            {/*    <div>Set Charging State Mutation: {startChargingMutation.status}</div>*/}
            {/*    {getWallboxStatusQuery.data?.map((device) => (*/}
            {/*        <div key={device.id}>*/}
            {/*            <button*/}
            {/*                type="button"*/}
            {/*                disabled={!device.chargingEnabled && device.evseWallboxState !== 'vehiclePresent'}*/}
            {/*                onClick={() => {*/}
            {/*                    startChargingMutation.mutate({*/}
            {/*                        chargerId: device.id,*/}
            {/*                        membershipId: MEMBERSHIP_ID_NOBODY,*/}
            {/*                    });*/}
            {/*                }}*/}
            {/*            >*/}
            {/*                Authorize {device.friendlyName} ({device.id})*/}
            {/*            </button>*/}
            {/*        </div>*/}
            {/*    ))}*/}
            {/*</main>*/}
        </>
    );
}
