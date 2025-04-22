import type { SelectChangeEvent } from '@mui/material';
import {
    Autocomplete,
    Box,
    Checkbox,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { subDays } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useState } from 'react';

import { MEMBERSHIP_ID_NOBODY } from '@/constants';
import type {
    CompletedChargingSessionInBooking,
    RunningChargingSessionInBooking,
} from '@/services/chargingSessionService';
import { trpc } from '@/trpc-client';
import type { WallboxStatusWithChargingSession } from '@/types/trpc';
import type { CobotApiResponseGetMemberships } from '@/types/zod/cobotApi';

interface ChargingSessionHistoryProps {
    memberships: CobotApiResponseGetMemberships;
    chargers: WallboxStatusWithChargingSession[];
}

const ChargingSessionHistory = ({ memberships, chargers }: ChargingSessionHistoryProps) => {
    const [fromDate, setFromDate] = useState<Date>(() => {
        return subDays(new Date(), 1);
    });
    const [toDate, setToDate] = useState<Date>(() => new Date());
    const [selectedChargerIds, setSelectedChargerIds] = useState<string[] | null>(null);
    const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);

    // Query for charging session history
    const sessionHistoryQuery = trpc.getChargingSessionHistory.useQuery({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        chargerIds: selectedChargerIds,
        cobotMembershipId: selectedMembershipId,
    });

    // Constants for membership display
    const FREE_CHARGE = 'Free Charge';
    const NO_MEMBER = 'No Member';
    const ALL_MEMBERSHIPS = 'All Members';

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    // Format energy used
    const formatEnergy = (wattHours: number) => {
        return (wattHours / 1000).toFixed(3);
    };

    // Get membership name from ID
    const getMembershipName = (membershipId: string | null) => {
        if (!membershipId) {
            return FREE_CHARGE;
        }
        if (membershipId === MEMBERSHIP_ID_NOBODY) {
            return NO_MEMBER;
        }
        return memberships.find((m) => m.id === membershipId)?.name || membershipId;
    };

    // Get charger name from ID
    const getChargerName = (chargerId: string) => {
        return chargers.find((c) => c.id === chargerId)?.friendlyName || chargerId;
    };

    // Determine if a session is complete or ongoing
    const isCompleteSession = (
        session: RunningChargingSessionInBooking | CompletedChargingSessionInBooking,
    ): session is CompletedChargingSessionInBooking => {
        return 'totalEnergyWattHoursEnd' in session;
    };

    // Handle charger selection
    const handleChargerChange = (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value as string[];
        setSelectedChargerIds(value.length > 0 ? value : null);
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Charging Session History
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 3 }}>
                            <DateTimePicker
                                label="From"
                                value={fromDate}
                                onChange={(newValue: Date | null) => setFromDate(newValue || fromDate)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <DateTimePicker
                                label="To"
                                value={toDate}
                                onChange={(newValue: Date | null) => setToDate(newValue || toDate)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel id="charger-select-label">Chargers</InputLabel>
                                <Select
                                    labelId="charger-select-label"
                                    label="Chargers"
                                    multiple
                                    value={selectedChargerIds || []}
                                    onChange={handleChargerChange}
                                    renderValue={(selected) =>
                                        (selected as string[]).map((id) => getChargerName(id)).join(', ')
                                    }
                                >
                                    {chargers.map((charger) => (
                                        <MenuItem key={charger.id} value={charger.id}>
                                            <Checkbox
                                                checked={(selectedChargerIds || []).indexOf(charger.id) > -1}
                                                size="small"
                                            />
                                            {charger.friendlyName || charger.id}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Autocomplete
                                options={[
                                    { id: MEMBERSHIP_ID_NOBODY, name: NO_MEMBER, email: FREE_CHARGE },
                                    { id: null, name: ALL_MEMBERSHIPS, email: '' },
                                    ...memberships.map((m) => ({ id: m.id, name: m.name, email: m.email })),
                                ]}
                                getOptionLabel={(option) => option.name}
                                renderInput={(params) => <TextField {...params} label="Membership" />}
                                value={(() => {
                                    if (selectedMembershipId === MEMBERSHIP_ID_NOBODY) {
                                        return { id: MEMBERSHIP_ID_NOBODY, name: NO_MEMBER, email: FREE_CHARGE };
                                    }

                                    if (selectedMembershipId === null) {
                                        return { id: null, name: ALL_MEMBERSHIPS, email: '' };
                                    }

                                    const foundMembership = memberships.find((m) => m.id === selectedMembershipId);
                                    if (foundMembership) {
                                        return {
                                            id: selectedMembershipId,
                                            name: foundMembership.name,
                                            email: foundMembership.email,
                                        };
                                    }

                                    return { id: selectedMembershipId, name: selectedMembershipId, email: '' };
                                })()}
                                onChange={(_, newValue) => setSelectedMembershipId(newValue?.id ?? null)}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                            />
                        </Grid>
                    </Grid>
                </LocalizationProvider>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Charger</TableCell>
                            <TableCell>Membership</TableCell>
                            <TableCell>Started By</TableCell>
                            <TableCell>Start Time</TableCell>
                            <TableCell>End Time</TableCell>
                            <TableCell>Energy Used (kWh)</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(() => {
                            if (sessionHistoryQuery.isLoading) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            if (sessionHistoryQuery.isError) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            Error loading data
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            if (
                                sessionHistoryQuery.data === undefined ||
                                sessionHistoryQuery.data === null ||
                                sessionHistoryQuery.data.length === 0
                            ) {
                                return (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            No charging sessions found
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            return sessionHistoryQuery.data.map((session) => (
                                <TableRow key={session.bookingId}>
                                    <TableCell>{getChargerName(session.chargerId)}</TableCell>
                                    <TableCell>{getMembershipName(session.cobotMembershipId)}</TableCell>
                                    <TableCell>{session.cobotUserEmailStarted}</TableCell>
                                    <TableCell>{formatDate(session.from)}</TableCell>
                                    <TableCell>
                                        {isCompleteSession(session) ? formatDate(session.to) : 'Ongoing'}
                                    </TableCell>
                                    <TableCell>
                                        {
                                            isCompleteSession(session)
                                                ? formatEnergy(session.energyWattHoursUsed)
                                                : formatEnergy(0) /* We don't know energy used for ongoing sessions */
                                        }
                                    </TableCell>
                                    <TableCell>{isCompleteSession(session) ? session.price : '-'}</TableCell>
                                    <TableCell>{isCompleteSession(session) ? 'Completed' : 'Ongoing'}</TableCell>
                                </TableRow>
                            ));
                        })()}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ChargingSessionHistory;
