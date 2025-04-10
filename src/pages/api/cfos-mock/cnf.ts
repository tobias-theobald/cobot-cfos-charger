import type { NextApiRequest, NextApiResponse } from 'next';

import { ENABLE_CFOS_MOCK_ENDPOINT } from '@/env';

export const MOCK_CFOS_RFID_ID = 'abcdef01';
export const MOCK_CFOS_USERNAME = 'mockuser';
export const MOCK_CFOS_PASSWORD = 'mockpassword';

// eslint-disable-next-line sonarjs/no-nested-template-literals
const EXPECTED_AUTH_HEADER = `Basic ${Buffer.from(`${MOCK_CFOS_USERNAME}:${MOCK_CFOS_PASSWORD}`).toString('base64')}`;

// Mock data with wallboxes
const mockWallboxes = [
    {
        dev_type: 'evse_powerbrain',
        address: 'evse:',
        desc: 'Wallbox 1',
        state: 2, // vehiclePresent
        dev_id: 'wallbox-1',
        total_energy: 1000, // starting energy in watt-hours
        charging_enabled: false,
        last_state_change: Date.now(),
    },
    {
        dev_type: 'evse_powerbrain',
        address: 'evse:',
        desc: 'Wallbox 2',
        state: 2, // vehiclePresent
        dev_id: 'wallbox-2',
        total_energy: 2000, // starting energy in watt-hours
        charging_enabled: false,
        last_state_change: Date.now(),
    },
    {
        dev_type: 'evse_powerbrain',
        address: 'evse:',
        desc: 'Wallbox 3',
        state: 1, // always free (no vehicle)
        dev_id: 'wallbox-3',
        total_energy: 3000, // starting energy in watt-hours
        charging_enabled: false,
        last_state_change: Date.now(),
    },
    // Adding a non-wallbox device to demonstrate filtering
    {
        dev_type: 'other_device',
        address: 'device:',
        desc: 'Some other device',
        dev_id: 'non-wallbox',
    },
];

// Update energy for charging wallboxes
const updateWallboxEnergy = () => {
    const now = Date.now();
    mockWallboxes.forEach((wallbox) => {
        if (wallbox.dev_type === 'evse_powerbrain' && wallbox.state === 3) {
            // charging state
            // Add 1 watt-hour per second of charging
            const secondsSinceLastUpdate = Math.floor((now - wallbox.last_state_change) / 1000);
            if (secondsSinceLastUpdate > 0) {
                wallbox.total_energy += secondsSinceLastUpdate;
                wallbox.last_state_change = now;
            }
        }
    });
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (ENABLE_CFOS_MOCK_ENDPOINT !== 'true') {
        return {
            ok: false,
            error: new Error('CFOS mock endpoint is not enabled. Set ENABLE_CFOS_MOCK_ENDPOINT=true to enable it.'),
        };
    }

    // Check basic auth (we're not actually checking credentials in the mock)
    const authHeader = req.headers.authorization;
    if (authHeader !== EXPECTED_AUTH_HEADER) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update energies for charging stations
    updateWallboxEnergy();

    // Handle different CFOS commands
    const { cmd, dev_id, rfid } = req.query;

    // Command: get_dev_info - returns all wallboxes
    if (cmd === 'get_dev_info') {
        return res.status(200).json({
            devices: mockWallboxes.map(({ last_state_change, ...device }) => device),
        });
    }

    // Command: enter_rfid - authorize a wallbox for charging
    if (cmd === 'enter_rfid' && typeof dev_id === 'string' && typeof rfid === 'string') {
        const wallbox = mockWallboxes.find((wb) => wb.dev_id === dev_id);

        if (!wallbox) {
            return res.status(404).json({ error: `Wallbox with ID ${dev_id} not found` });
        }
        if (rfid !== MOCK_CFOS_RFID_ID) {
            return res.status(403).json({ error: 'Invalid RFID ID' });
        }

        // Wallbox 3 should always show no vehicle present
        if (wallbox.dev_id === 'wallbox-3') {
            return res.status(200).json({});
        }

        // Toggle charging state if a vehicle is present
        if (wallbox.state === 2) {
            // vehiclePresent
            wallbox.state = 3; // charging
            wallbox.charging_enabled = true;
            wallbox.last_state_change = Date.now(); // Reset the timer for energy counting
        } else if (wallbox.state === 3) {
            // charging
            wallbox.state = 2; // vehiclePresent
            wallbox.charging_enabled = false;
        }

        return res.status(200).json({});
    }

    // Unknown command
    return res.status(400).json({ error: 'Unknown command' });
}
