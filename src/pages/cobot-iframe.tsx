import Head from 'next/head';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
    return (
        <>
            <Head>
                <title>Create Next App</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className={inter.className}>Hi there, hello</main>
        </>
    );
}

// TODO: add redirect to /api/oauth/init-user if no iframe token is passed in query parameter
