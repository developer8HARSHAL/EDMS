import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { store, persistor } from './store';
import { ThemeProvider } from './context/ThemeContext';

// ---------------------------------------------------------------------------
// Silence ALL console output in production so nobody inspecting the deployed
// site sees internal logs, warnings, or errors. This doesn't shrink the
// bundle (the console.* calls are still present, just no-op'd) — it only
// stops output.
//
// TRADE-OFF, on purpose per explicit requirement: console.error and
// console.warn are silenced too, not just log/debug/info. This means you
// will NOT see real production errors in the browser console either,
// including your own testing/debugging on the live site. If you need
// production error visibility without exposing it to end users, that
// requires a proper error-tracking service (e.g. Sentry) that reports
// errors to you out-of-band instead of printing them to the console — a
// separate piece of work, not something console-suppression can give you.
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.log = () => {};
  // eslint-disable-next-line no-console
  console.debug = () => {};
  // eslint-disable-next-line no-console
  console.info = () => {};
  // eslint-disable-next-line no-console
  console.warn = () => {};
  // eslint-disable-next-line no-console
  console.error = () => {};
}

// ---------------------------------------------------------------------------
// Global safety net for unhandled promise rejections and uncaught errors.
//
// IMPORTANT: ErrorBoundary (React) can ONLY catch errors thrown during
// render/lifecycle methods. It CANNOT catch errors from async functions in
// effects, event handlers, or promise chains that reject without a .catch().
// That's a completely separate failure mode, and needs its own handler here.
//
// In production, this turns what would otherwise be a silently broken UI (or,
// during local dev, react-error-overlay's full-screen crash page) into a
// small dismissible toast — the user sees "something went wrong", not a raw
// stack trace, and the rest of the app keeps working.
//
// Note: in `npm start` (development), react-error-overlay may still show its
// full-screen overlay for unhandled rejections regardless of this handler —
// that overlay is dev-tooling injected by webpack-dev-server and is NOT
// present in a production build (`npm run build`), so this fix's real impact
// is on what actual deployed users see, not the local dev experience.
// ---------------------------------------------------------------------------
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  toast.error('Something went wrong. Please try again.', { id: 'global-error' });
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error || event.message);
  toast.error('Something went wrong. Please try again.', { id: 'global-error' });
});

const PersistGateLoader = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading application...</p>
    </div>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<PersistGateLoader />} persistor={persistor}>
        <ThemeProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();













