import {
    Battery80 as BatteryMedium,
    BatteryChargingFull as BatteryCharging,
    BatteryFull,
    PlayArrow as PlayCircle,
    SignalWifiOff as WifiOff,
    Stop as StopCircle,
    Warning as AlertTriangle,
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import { useState } from 'react';

import type { EvseWallboxState, GetWallboxesResponse } from '@/api/cfos';
import MembershipSelectionDialog from '@/components/MembershipSelectionDialog';
import type { CobotApiResponseGetMemberships } from '@/types/zod';

interface ChargerCardProps {
    charger: GetWallboxesResponse[number];
    memberships: CobotApiResponseGetMemberships;
    onStartCharging: (chargerId: string, membershipId: string) => void;
    onStopCharging: (chargerId: string) => void;
}

const getStatusColor = (status: EvseWallboxState): string => {
    switch (status) {
        case 'free':
            return 'success.main';
        case 'vehiclePresent':
            return 'warning.main';
        case 'charging':
            return 'primary.main';
        case 'offline':
            return 'text.disabled';
        case 'error':
            return 'error.main';
        default:
            return 'text.primary';
    }
};

const getStatusIcon = (status: EvseWallboxState) => {
    switch (status) {
        case 'free':
            return <BatteryFull />;
        case 'vehiclePresent':
            return <BatteryMedium />;
        case 'charging':
            return <BatteryCharging />;
        case 'offline':
            return <WifiOff />;
        case 'error':
            return <AlertTriangle />;
        default:
            return <BatteryFull />;
    }
};

const getStatusText = (status: EvseWallboxState): string => {
    switch (status) {
        case 'free':
            return 'Available';
        case 'vehiclePresent':
            return 'Vehicle Connected';
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

const formatDuration = (isoString: string) => {
    const startTime = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const ChargerCard: React.FC<ChargerCardProps> = ({ charger, memberships, onStartCharging, onStopCharging }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);

    const handleStartCharging = () => {
        if (selectedMembershipId) {
            onStartCharging(charger.id, selectedMembershipId);
            setOpenDialog(false);
            setSelectedMembershipId(null);
        }
    };

    const handleStopCharging = () => {
        onStopCharging(charger.id);
    };

    const calculateEnergyUsed = () => {
        // TODO implement
        // if (charger.chargingEnabled) {
        //     return (charger.activeSession.currentMeterValue - charger.activeSession.initialMeterValue).toFixed(3);
        // }
        return '0.000';
    };

    // Check if charger is in a state where charging can be started
    const canStartCharging = charger.evseWallboxState === 'free' || charger.evseWallboxState === 'vehiclePresent';

    // Check if charger is in a state where charging can be stopped
    const canStopCharging = charger.evseWallboxState === 'charging';

    // Check if charger is in an error state or offline
    const isInErrorState = charger.evseWallboxState === 'error' || charger.evseWallboxState === 'offline';

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

                {/* TODO implement activeSession */}
                {/*{charger.activeSession && (*/}
                {/*    <Box*/}
                {/*        sx={{*/}
                {/*            mb: 2,*/}
                {/*            p: 2,*/}
                {/*            bgcolor: 'primary.light',*/}
                {/*            color: 'primary.contrastText',*/}
                {/*            borderRadius: 1,*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        <Typography variant="subtitle2">Active Session</Typography>*/}
                {/*        <Typography variant="body2">User: {charger.activeSession.user.name}</Typography>*/}
                {/*        <Typography variant="body2">*/}
                {/*            Duration: {formatDuration(charger.activeSession.startTime)}*/}
                {/*        </Typography>*/}
                {/*        <Typography variant="body2">Energy Used: {calculateEnergyUsed()} kWh</Typography>*/}
                {/*    </Box>*/}
                {/*)}*/}

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
                        >
                            Stop Charging
                        </Button>
                    )}

                    {isInErrorState && (
                        <Button variant="outlined" color="error" fullWidth disabled>
                            {charger.evseWallboxState === 'offline' ? 'Charger Offline' : 'Charger Error'}
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
            />
        </Card>
    );
};

export default ChargerCard;
