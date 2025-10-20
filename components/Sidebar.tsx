import React from 'react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  const navItems: { id: Page; label: string; icon: React.ReactElement }[] = [
    { id: 'generator', label: 'Generate', icon: <SparklesIcon /> },
    { id: 'manager', label: 'Manage Playbooks', icon: <FolderIcon /> },
    { id: 'vms', label: 'Manage VMs', icon: <ServerIcon /> },
    { id: 'comparator', label: 'Compare Results', icon: <CompareIcon /> },
  ];

  const NavLink: React.FC<{
    // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
    item: { id: Page; label: string; icon: React.ReactElement };
  }> = ({ item }) => {
    const isActive = currentPage === item.id;
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setCurrentPage(item.id);
        }}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <span className="mr-3">{item.icon}</span>
        {item.label}
      </a>
    );
  };

  return (
    <nav className="w-64 bg-gray-900 p-4 border-r border-gray-700 flex-shrink-0">
      <div className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.id} item={item} />
        ))}
      </div>
    </nav>
  );
};

const SparklesIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 16l-4 4-4-4 6.293-6.293a1 1 0 011.414 0L15 12m0 0l-2.293 2.293a1 1 0 01-1.414 0L10 13m2.293-2.293a1 1 0 010-1.414L15 6m0 0l2.293-2.293a1 1 0 011.414 0L21 7.707a1 1 0 010 1.414L16 14m-4-4l-4 4" />
  </svg>
);
const FolderIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);
const ServerIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);
const CompareIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


export default Sidebar;