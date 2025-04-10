import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import type React from 'react';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { usePrevious } from 'react-use';

import { MEMBERSHIP_ID_NOBODY } from '@/constants';
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

const filterOptions = (options: CobotMembership[], state: { inputValue: string }) => {
    const inputValue = state.inputValue.toLowerCase();
    return options.filter(
        (option) => option.name.toLowerCase().includes(inputValue) || option.email.toLowerCase().includes(inputValue),
    );
};

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
    const previousOpen = usePrevious(open);

    useEffect(() => {
        if (open && !previousOpen) {
            onMembershipChange(null);
        }
        // This effect should only run when the dialog opens
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, previousOpen]);

    const options = useMemo(
        () => [{ name: 'No Member', email: 'Free / Pay at Counter', id: MEMBERSHIP_ID_NOBODY }, ...memberships],
        [memberships],
    );
    const value = options.find((membership) => membership.id === selectedMembershipId) ?? null;
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Autocomplete
                    sx={{ mt: 2, minWidth: 300 }}
                    options={options}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    renderInput={(params) => <TextField {...params} label="Search Member" />}
                    value={value}
                    onChange={(_, newValue) => onMembershipChange(newValue?.id ?? null)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    filterOptions={filterOptions}
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
