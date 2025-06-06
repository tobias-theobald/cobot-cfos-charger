import { Settings as SettingsIcon } from '@mui/icons-material';
import { Box, Button, FormControlLabel, Grid, Switch } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';

import ChargerCard from '@/components/ChargerCard';
import ChargingSessionHistory from '@/components/ChargingSessionHistory';
import SettingsDialog from '@/components/SettingsDialog';
import { trpc } from '@/trpc-client';
import type { CobotSpaceSettingsForUi } from '@/types/zod/other';

export default function IframeAdmin() {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [expertMode, setExpertMode] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const getWallboxStatusQuery = trpc.getWallboxesStatusWithChargingSession.useQuery(undefined, {
        refetchInterval: 30000,
    });

    // Create a mapping of charger IDs to friendly names
    const chargerNameById = Object.fromEntries(
        getWallboxStatusQuery.data?.map((charger) => [charger.id, charger.friendlyName || charger.id]) || [],
    );

    // Helper to get charger name
    const getChargerName = (chargerId: string) => chargerNameById[chargerId] || chargerId;

    const startChargingWithoutSessionMutation = trpc.startChargingWithoutSession.useMutation({
        onSuccess: (_, variables) => {
            enqueueSnackbar(`Direct charging started successfully on ${getChargerName(variables.chargerId)}`, {
                variant: 'success',
            });
        },
        onError: (error, variables) => {
            enqueueSnackbar(
                `Error starting direct charging on ${getChargerName(variables.chargerId)}: ${error.message}`,
                {
                    variant: 'error',
                },
            );
        },
        onSettled: () => {
            // Refetch the wallbox status after starting charging
            getWallboxStatusQuery.refetch().catch(() => {
                // nop, handle error in the query
            });
        },
    });

    const stopChargingWithoutSessionMutation = trpc.stopChargingWithoutSession.useMutation({
        onSuccess: (_, variables) => {
            enqueueSnackbar(`Direct charging stopped successfully on ${getChargerName(variables.chargerId)}`, {
                variant: 'success',
            });
        },
        onError: (error, variables) => {
            enqueueSnackbar(
                `Error stopping direct charging on ${getChargerName(variables.chargerId)}: ${error.message}`,
                {
                    variant: 'error',
                },
            );
        },
        onSettled: () => {
            // Refetch the wallbox status after stopping charging
            getWallboxStatusQuery.refetch().catch(() => {
                // nop, handle error in the query
            });
        },
    });

    const startChargingMutation = trpc.startChargingWithSession.useMutation({
        onSuccess: (_, variables) => {
            enqueueSnackbar(`Charging started successfully on ${getChargerName(variables.chargerId)}`, {
                variant: 'success',
            });
        },
        onError: (error, variables) => {
            enqueueSnackbar(`Error starting charging on ${getChargerName(variables.chargerId)}: ${error.message}`, {
                variant: 'error',
            });
        },
        onSettled: () => {
            // Refetch the wallbox status after starting charging
            getWallboxStatusQuery.refetch().catch(() => {
                // nop, handle error in the query
            });
        },
    });
    const stopChargingMutation = trpc.stopChargingWithSession.useMutation({
        onSuccess: (_, variables) => {
            enqueueSnackbar(`Charging stopped successfully on ${getChargerName(variables.chargerId)}`, {
                variant: 'success',
            });
        },
        onError: (error, variables) => {
            enqueueSnackbar(`Error stopping charging on ${getChargerName(variables.chargerId)}: ${error.message}`, {
                variant: 'error',
            });
        },
        onSettled: () => {
            // Refetch the wallbox status after starting charging
            getWallboxStatusQuery.refetch().catch(() => {
                // nop, handle error in the query
            });
        },
    });
    const getMembershipsQuery = trpc.getMemberships.useQuery(undefined, {
        // This API is heavily rate-limited and unlikely to change much, so we can cache it until the user reloads, probably
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchIntervalInBackground: false,
    });
    const wallboxStateLoading =
        getWallboxStatusQuery.isLoading ||
        startChargingMutation.isLoading ||
        stopChargingMutation.isLoading ||
        startChargingWithoutSessionMutation.isLoading ||
        stopChargingWithoutSessionMutation.isLoading;

    const getCobotSpaceSettingsQuery = trpc.getCobotSpaceSettings.useQuery();
    const setCobotSpaceSettingsMutation = trpc.setCobotSpaceSettings.useMutation({
        onSuccess: () => {
            enqueueSnackbar('Settings saved successfully', { variant: 'success' });
            getCobotSpaceSettingsQuery.refetch().catch(() => {
                // nop, handle error in the query
            });
        },
        onError: (error) => {
            enqueueSnackbar(`Error saving settings: ${error.message}`, { variant: 'error' });
        },
    });

    const handleSaveSettings = useCallback(
        (settings: CobotSpaceSettingsForUi) => {
            setCobotSpaceSettingsMutation.mutate(settings);
        },
        [setCobotSpaceSettingsMutation],
    );

    const handleStartCharging = useCallback(
        async (chargerId: string, membershipId: string) => {
            await startChargingMutation.mutateAsync({ chargerId, membershipId });
        },
        [startChargingMutation],
    );

    const handleStopCharging = useCallback(
        async (chargerId: string) => {
            await stopChargingMutation.mutateAsync({ chargerId });
        },
        [stopChargingMutation],
    );

    const handleStartDirectCharging = useCallback(
        (chargerId: string) => {
            startChargingWithoutSessionMutation.mutate({ chargerId });
        },
        [startChargingWithoutSessionMutation],
    );

    const handleStopDirectCharging = useCallback(
        (chargerId: string) => {
            stopChargingWithoutSessionMutation.mutate({ chargerId });
        },
        [stopChargingWithoutSessionMutation],
    );

    return (
        <>
            <Box sx={{ flexGrow: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 2 }}>
                    <FormControlLabel
                        control={<Switch checked={expertMode} onChange={(e) => setExpertMode(e.target.checked)} />}
                        label="Expert Mode"
                        sx={{ color: 'text.secondary' }}
                    />
                    <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setSettingsOpen(true)}>
                        Settings
                    </Button>
                </Box>

                {getWallboxStatusQuery.data && getMembershipsQuery.data && getCobotSpaceSettingsQuery.data ? (
                    <>
                        <Grid container spacing={3}>
                            {getWallboxStatusQuery.data.map((charger) => (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={charger.id}>
                                    <ChargerCard
                                        charger={charger}
                                        memberships={getMembershipsQuery.data}
                                        onStartCharging={handleStartCharging}
                                        onStopCharging={handleStopCharging}
                                        onStartDirectCharging={handleStartDirectCharging}
                                        onStopDirectCharging={handleStopDirectCharging}
                                        expertMode={expertMode}
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

                        <ChargingSessionHistory
                            memberships={getMembershipsQuery.data}
                            chargers={getWallboxStatusQuery.data}
                        />
                    </>
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
