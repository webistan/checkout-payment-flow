import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'react-tooltip/dist/react-tooltip.css';

// Replace with your real Client ID from the Google Cloud Console
const googleClientId = '688230090646-5cr2mt2l9u9i87brld4g9f8s470a93j4.apps.googleusercontent.com';

const container = document.getElementById('root');
const root = createRoot(container);

if (process.env.NODE_ENV !== 'development') {
  console.log = () => {};
  console.warn = () => {};
}

root.render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>,
);
