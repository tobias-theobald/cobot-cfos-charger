import type { FormEvent } from 'react';
import { memo, useCallback } from 'react';

const App = () => {
    const onSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
        // This is part of why I prefer using libs or onChange listeners here
        const space = (
            event.currentTarget.elements as typeof event.currentTarget.elements & {
                space: { value: string };
            }
        ).space.value;
        if (space === '') {
            return;
        }
        const searchParams = new URLSearchParams({ space });
        window.document.location.href = `/api/oauth/install?${searchParams.toString()}`;
        event.preventDefault();
    }, []);

    return (
        <div>
            <form onSubmit={onSubmit}>
                <div>
                    <label htmlFor="space">Cobot Space Subdomain</label>
                </div>
                <div>
                    <input id="space" type="text" name="space" />
                </div>
                <div>
                    <button type="submit">Install app into a cobot space</button>
                </div>
            </form>
        </div>
    );
};

export default memo(App);
