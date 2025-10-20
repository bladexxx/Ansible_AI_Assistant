import React, { useState, useEffect } from 'react';
import { UserRole, Playbook, VM, ExecutionResult } from '../types';
import { analyzePlaybook } from '../services/geminiService';
import Button from './common/Button';
import Card from './common/Card';
import Spinner from './common/Spinner';

interface PlaybookManagerProps {
  userRole: UserRole;
  playbooks: Playbook[];
  vms: VM[];
  onSaveResult: (result: ExecutionResult) => void;
}

const PlaybookManager: React.FC<PlaybookManagerProps> = ({ userRole, playbooks, vms, onSaveResult }) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  
  const [selectedVmId, setSelectedVmId] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState('');
  
  const canExecute = userRole === UserRole.Admin || userRole === UserRole.Operator;

  useEffect(() => {
    if (playbooks.length > 0 && !selectedPlaybook) {
      setSelectedPlaybook(playbooks[0]);
    }
    if (vms.length > 0 && !selectedVmId) {
      setSelectedVmId(vms[0].id);
    }
  }, [playbooks, vms, selectedPlaybook, selectedVmId]);

  const handleSelectPlaybook = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setAnalysis('');
    setExecutionLog('');
  };

  const handleAnalyze = async () => {
    if (!selectedPlaybook) return;
    setIsLoadingAnalysis(true);
    const result = await analyzePlaybook(selectedPlaybook.content);
    setAnalysis(result);
    setIsLoadingAnalysis(false);
  };

  const handleExecute = () => {
    if (!selectedPlaybook || !selectedVmId || !canExecute) return;
    setIsExecuting(true);
    setExecutionLog('');
    // Simulate execution
    const vmName = vms.find(v => v.id === selectedVmId)?.name || 'Unknown VM';
    const log = `
SIMULATING PLAYBOOK EXECUTION
-----------------------------
Playbook: ${selectedPlaybook.name}
Target VM: ${vmName} (${vms.find(v => v.id === selectedVmId)?.host})
User: ${userRole}
Timestamp: ${new Date().toISOString()}

PLAY [Simulated Play] ********************************************

TASK [Gathering Facts] *******************************************
ok: [${vmName}]

TASK [Simulated Task 1] ******************************************
changed: [${vmName}]

TASK [Simulated Task 2] ******************************************
ok: [${vmName}]

PLAY RECAP *******************************************************
${vmName} : ok=3 changed=1 unreachable=0 failed=0 skipped=0
`;
    
    setTimeout(() => {
      setExecutionLog(log);
      setIsExecuting(false);
      // Automatically save result for demo
      const result: ExecutionResult = {
        id: `res-${Date.now()}`,
        playbookId: selectedPlaybook.id,
        playbookName: selectedPlaybook.name,
        vmId: selectedVmId,
        vmName: vmName,
        timestamp: new Date().toISOString(),
        output: log,
      };
      onSaveResult(result);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-6">
      {/* --- Left Column --- */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="flex flex-col flex-1 min-h-0">
          <h2 className="text-2xl font-bold mb-4">Available Playbooks</h2>
          <Card className="flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {playbooks.map(p => (
                <li key={p.id} 
                    onClick={() => handleSelectPlaybook(p)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${selectedPlaybook?.id === p.id ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-400">{p.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card>
          <h4 className="text-lg font-semibold mb-4">On-Demand Execution</h4>
          <div className="flex items-center space-x-4 mb-4">
            <select
              value={selectedVmId}
              onChange={(e) => setSelectedVmId(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              disabled={!canExecute}
            >
              {vms.map(vm => <option key={vm.id} value={vm.id}>{vm.name}</option>)}
            </select>
            <Button onClick={handleExecute} disabled={isExecuting || !canExecute}>{isExecuting ? "..." : "Execute"}</Button>
          </div>
          {!canExecute && <p className="text-sm text-yellow-400 mb-4">You do not have permission to execute playbooks.</p>}
          {isExecuting ? <Spinner /> : executionLog && (
            <pre className="bg-gray-900 p-4 rounded-md overflow-x-auto font-mono text-sm text-green-400 border border-gray-700 max-h-48">
              <code>{executionLog}</code>
            </pre>
          )}
        </Card>
      </div>

      {/* --- Right Column --- */}
      <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2">
        {selectedPlaybook ? (
          <>
            <Card>
              <h3 className="text-xl font-bold mb-2">{selectedPlaybook.name}</h3>
              <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto font-mono text-sm max-h-64 border border-gray-700">
                  <code>{selectedPlaybook.content}</code>
              </pre>
            </Card>
            <Card>
              <h4 className="text-xl font-semibold mb-4">AI Analysis & Validation</h4>
              {isLoadingAnalysis ? <Spinner /> : 
                analysis ? <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{__html: analysis.replace(/\n/g, '<br />') }}/> : 
                <Button onClick={handleAnalyze} className="self-start">Analyze with AI</Button>
              }
            </Card>
          </>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a playbook to view details.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlaybookManager;