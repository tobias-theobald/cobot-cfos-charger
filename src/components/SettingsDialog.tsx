// import {
//     Box,
//     Button,
//     Dialog,
//     DialogActions,
//     DialogContent,
//     DialogTitle,
//     FormControl,
//     InputLabel,
//     MenuItem,
//     Select,
//     Typography,
// } from '@mui/material';
// import React from 'react';
//
// interface SettingsModalProps {
//     open: boolean;
//     onClose: () => void;
//     settings: AppSettings;
//     accountingCodes: AccountingCode[];
//     onSaveSettings: (settings: AppSettings) => void;
// }
//
// const SettingsDialog: React.FC<SettingsModalProps> = ({ open, onClose, settings, accountingCodes, onSaveSettings }) => {
//     const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
//
//     React.useEffect(() => {
//         setLocalSettings(settings);
//     }, [settings]);
//
//     const handleSave = () => {
//         onSaveSettings(localSettings);
//         onClose();
//     };
//
//     const handleCancel = () => {
//         setLocalSettings(settings); // Reset to original settings
//         onClose();
//     };
//
//     return (
//         <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
//             <DialogTitle>Settings</DialogTitle>
//             <DialogContent>
//                 <Box sx={{ my: 2 }}>
//                     <Typography variant="h6" gutterBottom>
//                         Accounting Settings
//                     </Typography>
//
//                     <FormControl fullWidth sx={{ mt: 2 }}>
//                         <InputLabel id="accounting-code-label">Default Accounting Code</InputLabel>
//                         <Select
//                             labelId="accounting-code-label"
//                             value={localSettings.selectedAccountingCode}
//                             label="Default Accounting Code"
//                             onChange={(e) =>
//                                 setLocalSettings({
//                                     ...localSettings,
//                                     selectedAccountingCode: e.target.value,
//                                 })
//                             }
//                         >
//                             {accountingCodes.map((code) => (
//                                 <MenuItem key={code.id} value={code.id}>
//                                     {code.code} - {code.description}
//                                 </MenuItem>
//                             ))}
//                         </Select>
//                     </FormControl>
//                 </Box>
//             </DialogContent>
//             <DialogActions>
//                 <Button onClick={handleCancel}>Cancel</Button>
//                 <Button onClick={handleSave} variant="contained">
//                     Save
//                 </Button>
//             </DialogActions>
//         </Dialog>
//     );
// };
//
// export default SettingsDialog;
export default {};
