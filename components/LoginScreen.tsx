
import React from 'react';
import { UserRole } from '../types';
import Button from './common/Button';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center p-10 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full">
        <h1 className="text-4xl font-bold text-white mb-2">Ansible AI Assistant</h1>
        <p className="text-gray-400 mb-8">Select your role to continue</p>
        <div className="space-y-4">
          <Button onClick={() => onLogin(UserRole.Admin)} className="w-full text-lg">
            Login as Admin
          </Button>
          <Button onClick={() => onLogin(UserRole.Operator)} className="w-full text-lg" variant="secondary">
            Login as Operator
          </Button>
          <Button onClick={() => onLogin(UserRole.Developer)} className="w-full text-lg" variant="secondary">
            Login as Developer
          </Button>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>This is a simulated login for demonstration purposes.</p>
          <p>A production app would integrate with an SSO provider like Azure AD using OAuth 2.0.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
