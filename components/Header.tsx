
import React from 'react';
import { UserRole } from '../types';

interface HeaderProps {
  userRole: UserRole;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, onLogout, onRoleChange }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
      <h1 className="text-xl font-semibold text-white">Ansible AI Assistant</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-400">Role:</span>
        <select
          value={userRole}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
          className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.values(UserRole).map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <button
          onClick={onLogout}
          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
