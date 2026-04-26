import React from 'react';
import ReactDOM from 'react-dom/client';
import { initConsoleOverrides } from '@/shared/utils/console-overrides';
import { initSentryProvider } from '@/providers/sentry-provider';
import '@/shared/i18n';
import { App } from './App';
import './index.css';

// Initialize console overrides (silences logs in production, routes errors to Sentry)
initConsoleOverrides();

// Initialize Sentry error monitoring
initSentryProvider();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
