import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      basicSsl()
    ],
    // FIX: Removed the explicit `server.https: true` configuration.
    // The `@vitejs/plugin-basic-ssl` plugin handles this automatically, and the
    // manual setting was causing a type conflict.
    // The 'define' option performs a direct text replacement at build time. This is the
    // most reliable way to inject environment variables.
    define: {
      // We use JSON.stringify to ensure the values are correctly quoted as strings.
      // We also provide a fallback to avoid "undefined" being injected.
      'process.env.VITE_AI_PROVIDER': JSON.stringify(env.VITE_AI_PROVIDER || 'GEMINI'),
      'process.env.VITE_AI_GATEWAY_URL': JSON.stringify(env.VITE_AI_GATEWAY_URL || ''),
      'process.env.VITE_AI_GATEWAY_API_KEY': JSON.stringify(env.VITE_AI_GATEWAY_API_KEY || ''),
      'process.env.VITE_AI_GATEWAY_MODEL': JSON.stringify(env.VITE_AI_GATEWAY_MODEL || ''),
      // Per project guidelines, the Gemini API key MUST come from the execution environment's `process.env.API_KEY`.
      // It is NOT defined here, so the application code will read it directly from the true `process.env` object.

      // OIDC Configuration for Enterprise SSO
      // In a real application, these values would be stored in a .env file. For example:
      // VITE_OIDC_DISCOVERY_URL="https://login.microsoftonline.com/<YOUR_TENENT_ID>/v2.0/.well-known/openid-configuration"
      // VITE_OIDC_CLIENT_ID="<YOUR_APPLICATION_CLIENT_ID>"
      // IMPORTANT: The oidc.client.secret should NEVER be stored in frontend code.
      // It's used for backend server flows (confidential clients).
      // Frontend SPAs use flows like 'Authorization Code with PKCE' which don't require a secret.
      'process.env.VITE_OIDC_DISCOVERY_URL': JSON.stringify(env.VITE_OIDC_DISCOVERY_URL || ''),
      'process.env.VITE_OIDC_CLIENT_ID': JSON.stringify(env.VITE_OIDC_CLIENT_ID || ''),
    }
  };
});
