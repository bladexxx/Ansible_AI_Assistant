import React, { useState, useCallback } from 'react';
import { UserRole, Page } from './types';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PlaybookGenerator from './components/PlaybookGenerator';
import PlaybookManager from './components/PlaybookManager';
import VmManager from './components/VmManager';
import ResultComparator from './components/ResultComparator';
import { Playbook, VM, ExecutionResult } from './types';
import { mockPlaybooks, mockVms, mockExecutionResults, DEFAULT_GROUP_NAME } from './constants';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('generator');
  
  const [playbooks, setPlaybooks] = useState<Playbook[]>(mockPlaybooks);
  const [vms, setVms] = useState<VM[]>(mockVms);
  const [results, setResults] = useState<ExecutionResult[]>(mockExecutionResults);

  const handleLogin = useCallback((role: UserRole) => {
    setUserRole(role);
    setCurrentPage('generator');
  }, []);

  const handleLogout = useCallback(() => {
    setUserRole(null);
  }, []);

  const addPlaybook = (playbook: Playbook) => {
    setPlaybooks(prev => [playbook, ...prev]);
  };

  const updatePlaybook = (updatedPlaybook: Playbook) => {
    setPlaybooks(prev => prev.map(p => p.id === updatedPlaybook.id ? updatedPlaybook : p));
  };
  
  const renamePlaybookGroup = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    setPlaybooks(prev => prev.map(p => p.group === oldName ? { ...p, group: newName } : p));
  };
  
  const deletePlaybookGroup = (groupName: string) => {
    setPlaybooks(prev => prev.map(p => p.group === groupName ? { ...p, group: DEFAULT_GROUP_NAME } : p));
  };

  const saveExecutionResult = (result: ExecutionResult) => {
    setResults(prev => [...prev, result]);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'generator':
        return <PlaybookGenerator userRole={userRole!} onPlaybookGenerated={addPlaybook} />;
      case 'manager':
        return <PlaybookManager 
                  userRole={userRole!} 
                  playbooks={playbooks} 
                  vms={vms} 
                  onSaveResult={saveExecutionResult}
                  onUpdatePlaybook={updatePlaybook}
                  onRenameGroup={renamePlaybookGroup}
                  onDeleteGroup={deletePlaybookGroup}
                />;
      case 'vms':
        return <VmManager userRole={userRole!} vms={vms} setVms={setVms} />;
      case 'comparator':
        return <ResultComparator results={results} />;
      default:
        return <PlaybookGenerator userRole={userRole!} onPlaybookGenerated={addPlaybook} />;
    }
  };

  if (!userRole) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userRole={userRole} onLogout={handleLogout} onRoleChange={setUserRole} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;