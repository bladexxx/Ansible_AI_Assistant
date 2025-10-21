import React from 'react';
import { UserRole } from '../types';
import Button from './common/Button';

// Reading OIDC configuration from environment variables injected by Vite.
// In a real project, these values would come from a .env file.
const oidcConfig = {
  discoveryUrl: process.env.VITE_OIDC_DISCOVERY_URL,
  clientId: process.env.VITE_OIDC_CLIENT_ID,
};
const isOidcConfigured = !!(oidcConfig.discoveryUrl && oidcConfig.clientId);


interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  
  // Simulate login: In a real app, this would redirect to the OIDC provider.
  // After successful authentication, the provider would redirect back with a token,
  // and we would establish the user's session and role.
  // For this demo, we'll log in the user as a 'Developer' to proceed.
  const handleOidcLogin = () => {
    onLogin(UserRole.Developer);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center p-10 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-lg w-full">
        <h1 className="text-4xl font-bold text-white mb-2">Ansible AI Assistant</h1>
        <p className="text-gray-400 mb-8">Enterprise Single Sign-On (SSO)</p>
        
        {isOidcConfigured ? (
          <div className="space-y-4">
            <Button onClick={handleOidcLogin} className="w-full text-lg">
              Login with Microsoft
            </Button>
            <div className="mt-6 text-left bg-gray-900 p-4 rounded-lg border border-gray-700 text-xs text-gray-400">
              <p className="font-semibold text-gray-200 mb-2">OIDC Configuration Detected:</p>
              <p className="font-mono break-all">
                <span className="text-blue-400">Client ID:</span> {oidcConfig.clientId}
              </p>
               <p className="font-mono break-all mt-1">
                <span className="text-blue-400">Discovery URL:</span> {oidcConfig.discoveryUrl}
              </p>
            </div>
          </div>
        ) : (
           <div className="space-y-4 bg-yellow-900/50 border border-yellow-700 p-6 rounded-lg">
             <h3 className="font-bold text-yellow-300 text-lg">OIDC Not Configured</h3>
             <p className="text-yellow-400">
               Single Sign-On is not enabled. Please provide the necessary OIDC environment variables in your <code>.env</code> file to enable this feature.
             </p>
             <pre className="text-left text-xs bg-gray-900 p-3 rounded-md font-mono text-yellow-300">
                <code>
                  VITE_OIDC_DISCOVERY_URL=...<br/>
                  VITE_OIDC_CLIENT_ID=...
                </code>
             </pre>
           </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>This screen simulates an OIDC login flow using Microsoft Entra ID.</p>
          <p>A production app would use a library like MSAL to handle the redirect to the identity provider.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;