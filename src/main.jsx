import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { error as logError } from '@tauri-apps/plugin-log';
import ReactDOM from 'react-dom/client';
import React from 'react';

import { initStore } from './utils/store';
import { initEnv } from './utils/env';
import { initEdgeTtsVersion } from './utils/edge_tts_version';
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
        <NextThemesProvider attribute='class'>
            <App />
        </NextThemesProvider>
    );
}

initStore()
    .then(async () => {
        await initEnv();
        renderApp();
        void initEdgeTtsVersion();
    })
    .catch((e) => {
        logError(`init failed: ${e?.stack || e}`);
    });
