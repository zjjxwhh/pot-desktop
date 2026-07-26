import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { NextUIProvider } from '@nextui-org/react';
import { error as logError } from '@tauri-apps/plugin-log';
import ReactDOM from 'react-dom/client';
import React from 'react';

import { initStore } from './utils/store';
import { initEnv } from './utils/env';
import App from './App';

window.addEventListener('error', (e) => {
    logError(`window error: ${e.error?.stack || e.message}`);
});
window.addEventListener('unhandledrejection', (e) => {
    logError(`unhandled rejection: ${e.reason?.stack || e.reason}`);
});

if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

function renderApp() {
    const rootElement = document.getElementById('root');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <NextUIProvider>
            <NextThemesProvider attribute='class'>
                <App />
            </NextThemesProvider>
        </NextUIProvider>
    );
}

initStore()
    .then(async () => {
        await initEnv();
        renderApp();
    })
    .catch((e) => {
        logError(`init failed: ${e?.stack || e}`);
    });
