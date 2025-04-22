import {
    BatteryChargingFull as StatusIconVehicleCharging,
    ElectricCar as StatusIconVehiclePresent,
    PlayArrow as PlayCircle,
    PowerOff as StatusIconFree,
    SignalWifiOff as StatusIconChargerOffline,
    Stop as StopCircle,
    Warning as StatusIconError,
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import { useState } from 'react';

import MembershipSelectionDialog from '@/components/MembershipSelectionDialog';
import type { RunningChargingSessionInBooking } from '@/services/chargingSessionService';
import type { WallboxStatusWithChargingSession } from '@/types/trpc';
import type { EvseWallboxState } from '@/types/zod/cfos';
import type { CobotApiResponseGetMemberships } from '@/types/zod/cobotApi';

interface ChargerCardProps {
    charger: WallboxStatusWithChargingSession;
    memberships: CobotApiResponseGetMemberships;
    onStartCharging: (chargerId: string, membershipId: string) => Promise<void>;
    onStopCharging: (chargerId: string) => Promise<void>;
    loading: boolean;
    otherError?: string;
}

const getStatusColor = (status: EvseWallboxState): string => {
    switch (status) {
        case 'free':
            return 'success.main';
        case 'vehiclePresent':
            return 'info.main';
        case 'charging':
            return 'secondary.main';
        case 'offline':
            return 'text.disabled';
        case 'error':
            return 'error.main';
        default:
            return 'error.main'; // Fallback color for unknown status
    }
};

const getStatusIcon = (status: EvseWallboxState) => {
    switch (status) {
        case 'free':
            return <StatusIconFree />;
        case 'vehiclePresent':
            return <StatusIconVehiclePresent />;
        case 'charging':
            return <StatusIconVehicleCharging />;
        case 'offline':
            return <StatusIconChargerOffline />;
        case 'error':
            return <StatusIconError />;
        default:
            // TODO this should never happen, but ideally we'd send ourselves a message
            return <StatusIconError />;
    }
};

const getStatusText = (status: EvseWallboxState): string => {
    switch (status) {
        case 'free':
            return 'No Vehicle Connected';
        case 'vehiclePresent':
            return 'Vehicle Connected, Not Charging';
        case 'charging':
            return 'Charging';
        case 'offline':
            return 'Offline';
        case 'error':
            return 'Error';
        default:
            return 'Unknown';
    }
};

const formatDurationFromNow = (fromIsoString: string) => {
    const from = new Date(fromIsoString);
    const now = new Date();
    const diffMs = now.getTime() - from.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const ChargerCard = ({
    charger,
    memberships,
    onStartCharging,
    onStopCharging,
    loading,
    otherError,
}: ChargerCardProps) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);

    const handleStartCharging = () => {
        if (!selectedMembershipId) {
            return;
        }
        onStartCharging(charger.id, selectedMembershipId)
            .then(() => {
                setOpenDialog(false);
                setSelectedMembershipId(null);
            })
            .catch(() => {
                // nop, handled elsewhere
            });
    };

    const handleStopCharging = () => {
        onStopCharging(charger.id).catch(() => {
            // nop, handled elsewhere
        });
    };

    // Calculate energy used in a charging session
    const calculateEnergyUsed = (startEnergy: number, currentEnergy: number): string => {
        return ((currentEnergy - startEnergy) / 1000).toFixed(3);
    };

    // Check if charger is in a state where charging can be started
    const canStartCharging =
        charger.chargingSession.ok &&
        charger.chargingSession.value === null &&
        (charger.evseWallboxState === 'free' || charger.evseWallboxState === 'vehiclePresent');

    // Check if charger is in a state where charging can be stopped
    const canStopCharging =
        (charger.chargingSession.ok && charger.chargingSession.value !== null) ||
        charger.evseWallboxState === 'charging';

    // Check if charger is in an error state or offline
    const isInErrorState =
        !!otherError || charger.evseWallboxState === 'error' || charger.evseWallboxState === 'offline';

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 300 }}>
            <CardContent
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    pb: 2, // Reduce bottom padding to align buttons better
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                    <Typography variant="h6" component="div">
                        {charger.friendlyName}
                    </Typography>
                    <Chip
                        icon={getStatusIcon(charger.evseWallboxState)}
                        label={getStatusText(charger.evseWallboxState)}
                        sx={{
                            backgroundColor: getStatusColor(charger.evseWallboxState),
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' },
                        }}
                    />
                </Box>

                {charger.address && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Location
                        </Typography>
                        <Typography variant="body1">{charger.address}</Typography>
                    </Box>
                )}

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Energy Meter
                    </Typography>
                    <Typography variant="h6">{(charger.totalEnergyWattHours / 1000).toFixed(3)} kWh</Typography>
                </Box>

                {charger.chargingSession.ok && charger.chargingSession.value && (
                    <Box
                        sx={{
                            mb: 2,
                            p: 2,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            borderRadius: 1,
                        }}
                    >
                        <Typography variant="subtitle2">Active Session</Typography>
                        <Typography variant="body2">
                            Membership ID:{' '}
                            {charger.chargingSession.value.cobotMembershipId
                                ? (memberships.find(
                                      ({ id }) =>
                                          id ===
                                          (charger.chargingSession as { value: RunningChargingSessionInBooking }).value
                                              .cobotMembershipId,
                                  )?.name ?? charger.chargingSession.value.cobotMembershipId)
                                : 'Free Charge'}
                        </Typography>
                        <Typography variant="body2">
                            Started by: {charger.chargingSession.value.cobotUserEmailStarted}
                        </Typography>
                        <Typography variant="body2">
                            Start Time: {new Date(charger.chargingSession.value.from).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                            Latest End: {new Date(charger.chargingSession.value.to).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                            Duration: {formatDurationFromNow(charger.chargingSession.value.from)}
                        </Typography>
                        <Typography variant="body2">
                            Energy at start:{' '}
                            {(charger.chargingSession.value.totalEnergyWattHoursStart / 1000).toFixed(3)} kWh
                        </Typography>
                        <Typography variant="body2">
                            Energy used:{' '}
                            {calculateEnergyUsed(
                                charger.chargingSession.value.totalEnergyWattHoursStart,
                                charger.totalEnergyWattHours,
                            )}{' '}
                            kWh
                        </Typography>
                    </Box>
                )}

                {/* Spacer to push buttons to bottom */}
                <Box sx={{ flexGrow: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
                    {canStartCharging && !isInErrorState && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<PlayCircle />}
                            onClick={() => setOpenDialog(true)}
                            fullWidth
                            disabled={loading}
                            loading={loading}
                        >
                            Start Charging
                        </Button>
                    )}

                    {canStopCharging && (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<StopCircle />}
                            onClick={handleStopCharging}
                            fullWidth
                            disabled={loading}
                            loading={loading}
                        >
                            Stop Charging
                        </Button>
                    )}

                    {isInErrorState && (
                        <Button variant="outlined" color="error" fullWidth disabled loading={loading}>
                            {otherError ??
                                (charger.evseWallboxState === 'offline' ? 'Charger Offline' : 'Charger Error')}
                        </Button>
                    )}
                </Box>
            </CardContent>

            {/* User Selection Dialog */}
            <MembershipSelectionDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                memberships={memberships}
                selectedMembershipId={selectedMembershipId}
                onMembershipChange={setSelectedMembershipId}
                onConfirm={handleStartCharging}
                title="Select Member for Charging"
                confirmButtonText="Start Charging"
                loading={loading}
            />
        </Card>
    );
};

export default ChargerCard;
