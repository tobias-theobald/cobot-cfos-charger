import {
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import React, { useMemo } from 'react';

import { trpc } from '@/trpc-client';
import type { GetWallboxesResponse } from '@/types/zod/cfos';
import type { CobotApiResponseGetResource } from '@/types/zod/cobotApi';
import type { CobotSpaceSettingsForUi } from '@/types/zod/other';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
    chargers: GetWallboxesResponse;
    settings: CobotSpaceSettingsForUi;
    onSaveSettings: (settings: CobotSpaceSettingsForUi) => void;
}

const SettingsDialog: React.FC<SettingsModalProps> = ({ open, onClose, chargers, settings, onSaveSettings }) => {
    const [localSettings, setLocalSettings] = React.useState<CobotSpaceSettingsForUi>(settings);
    const getResourcesQuery = trpc.getResources.useQuery(undefined, {
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchOnMount: false,
    });

    const handleSave = () => {
        onSaveSettings(localSettings);
        onClose();
    };

    const handleCancel = () => {
        setLocalSettings(settings); // Reset to original settings
        onClose();
    };

    const handleResourceChange = (chargerId: string, resourceId: string | null) => {
        setLocalSettings((prev) => {
            const newResourceMapping = { ...prev.resourceMapping };
            if (resourceId) {
                newResourceMapping[chargerId] = resourceId;
            } else {
                delete newResourceMapping[chargerId];
            }
            return {
                ...prev,
                resourceMapping: newResourceMapping,
            };
        });
    };

    const handlePriceChange = (value: string) => {
        const price = parseFloat(value);
        if (!isNaN(price) && price >= 0) {
            setLocalSettings({
                ...localSettings,
                pricePerKWh: price,
            });
        }
    };

    const resources = useMemo(() => getResourcesQuery.data ?? [], [getResourcesQuery.data]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Settings</DialogTitle>
            <DialogContent>
                <Box sx={{ my: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Charger Resources
                    </Typography>

                    {chargers.map((charger) => (
                        <FormControl fullWidth key={charger.id} sx={{ mt: 2 }}>
                            <Autocomplete
                                options={resources}
                                getOptionLabel={(option: CobotApiResponseGetResource) => option.name}
                                value={
                                    resources.find(
                                        (resource) => resource.id === localSettings.resourceMapping[charger.id],
                                    ) ?? null
                                }
                                onChange={(_, newValue) => handleResourceChange(charger.id, newValue?.id || null)}
                                renderInput={(params) => (
                                    <TextField {...params} label={`Resource for ${charger.friendlyName}`} />
                                )}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                            />
                        </FormControl>
                    ))}

                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Pricing
                        </Typography>
                        <TextField
                            fullWidth
                            label="Price per kWh"
                            type="number"
                            slotProps={{
                                htmlInput: {
                                    min: 0,
                                    step: 0.01,
                                },
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">{resources[0]?.currency}</InputAdornment>
                                    ),
                                },
                            }}
                            value={localSettings.pricePerKWh}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SettingsDialog;
