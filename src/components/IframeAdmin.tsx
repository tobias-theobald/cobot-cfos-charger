import { Settings as SettingsIcon } from '@mui/icons-material';
import { Box, Button, Grid } from '@mui/material';
import { useCallback, useState } from 'react';

import ChargerCard from '@/components/ChargerCard';
import SettingsDialog from '@/components/SettingsDialog';
import { trpc } from '@/trpc-client';
import type { CobotSpaceSettingsForUi } from '@/types/zod/other';

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
    const wallboxStateLoading =
        getWallboxStatusQuery.isLoading || startChargingMutation.isLoading || stopChargingMutation.isLoading;

    const getCobotSpaceSettingsQuery = trpc.getCobotSpaceSettings.useQuery();
    const setCobotSpaceSettingsMutation = trpc.setCobotSpaceSettings.useMutation({
        onSettled: () => {
            getCobotSpaceSettingsQuery.refetch().catch(() => {
                // nop, handle error in the query
            });
        },
    });

    const handleSaveSettings = useCallback(
        (settings: CobotSpaceSettingsForUi) => {
            setCobotSpaceSettingsMutation.mutate(settings);
        },
        [setCobotSpaceSettingsMutation],
    );

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

                {getWallboxStatusQuery.data && getMembershipsQuery.data && getCobotSpaceSettingsQuery.data ? (
                    <Grid container spacing={3}>
                        {getWallboxStatusQuery.data.map((charger) => (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={charger.id}>
                                <ChargerCard
                                    charger={charger}
                                    memberships={getMembershipsQuery.data}
                                    onStartCharging={handleStartCharging}
                                    onStopCharging={handleStopCharging}
                                    loading={wallboxStateLoading}
                                    otherError={
                                        !getCobotSpaceSettingsQuery.data.resourceMapping[charger.id]
                                            ? 'No resource defined, please check settings'
                                            : undefined
                                    }
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    // TODO do a loading spinner
                    <>Loading...</>
                )}
            </Box>

            {getCobotSpaceSettingsQuery.data && getWallboxStatusQuery.data && (
                <SettingsDialog
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    chargers={getWallboxStatusQuery.data}
                    settings={getCobotSpaceSettingsQuery.data}
                    onSaveSettings={handleSaveSettings}
                />
            )}
        </>
    );
}
