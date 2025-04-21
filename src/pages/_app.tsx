import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@/styles/app.css';

import { CssBaseline } from '@mui/material';
import type { AppType } from 'next/app';
import { SnackbarProvider } from 'notistack';

import { trpc } from '@/trpc-client';

const MyApp: AppType = ({ Component, pageProps }) => {
    return (
        <>
            <CssBaseline />
            <SnackbarProvider>
                <Component {...pageProps} />
            </SnackbarProvider>
        </>
    );
};

export default trpc.withTRPC(MyApp);
