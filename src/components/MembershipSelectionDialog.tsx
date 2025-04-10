import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import type React from 'react';

import type { CobotMembership } from '@/types/zod';

interface MembershipSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    memberships: CobotMembership[];
    selectedMembershipId: string | null;
    onMembershipChange: (membership: string | null) => void;
    onConfirm: () => void;
    title?: string;
    confirmButtonText?: string;
}

const MembershipSelectionDialog: React.FC<MembershipSelectionDialogProps> = ({
    open,
    onClose,
    memberships,
    selectedMembershipId,
    onMembershipChange,
    onConfirm,
    title = 'Select Member',
    confirmButtonText = 'Confirm',
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Autocomplete
                    sx={{ mt: 2, minWidth: 300 }}
                    options={memberships}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    renderInput={(params) => <TextField {...params} label="Search Member" />}
                    value={memberships.find((membership) => membership.id === selectedMembershipId) ?? null}
                    onChange={(_, newValue) => onMembershipChange(newValue?.id ?? null)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    filterOptions={(options, state) => {
                        const inputValue = state.inputValue.toLowerCase();
                        return options.filter(
                            (option) =>
                                option.name.toLowerCase().includes(inputValue) ||
                                option.email.toLowerCase().includes(inputValue),
                        );
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" disabled={!selectedMembershipId}>
                    {confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MembershipSelectionDialog;
