// Custom Next.js server that initializes the wallbox monitoring service
import { createServer } from 'http';
import next from 'next';

import { start, stop } from '@/services/wallboxMonitorService';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
    .then(() => {
        console.log('Next.js server prepared, initializing wallbox monitoring service...');

        // Start the monitoring with a 1-minute interval (60000ms)
        const result = start(60000);
        if (result.ok) {
            console.log('Wallbox monitoring service started successfully');
        } else {
            console.error('Failed to start wallbox monitoring service:', result.error);
        }

        // Set up proper cleanup on server shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, stopping wallbox monitoring service');
            stop();
            process.exit(0);
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received, stopping wallbox monitoring service');
            stop();
            process.exit(0);
        });

        // Create the HTTP server
        createServer((req, res) => {
            handle(req, res);
        }).listen(process.env.PORT || 3000, (err?: Error) => {
            if (err) {
                throw err;
            }
            console.log(`> Ready on http://localhost:${process.env.PORT || 3000}`);
        });
    })
    .catch((ex) => {
        console.error(ex.stack);
        process.exit(1);
    });
