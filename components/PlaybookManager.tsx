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

interface BulkResult {
  id: string;
  playbook: Playbook;
  vm: VM;
  status: 'pending' | 'executing' | 'success' | 'failed';
  output?: string;
}

const PlaybookManager: React.FC<PlaybookManagerProps> = ({ userRole, playbooks, vms, onSaveResult }) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  
  const [selectedVmId, setSelectedVmId] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState('');
  
  // State for bulk operations
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedPlaybookIds, setSelectedPlaybookIds] = useState<Set<string>>(new Set());
  const [selectedVmIds, setSelectedVmIds] = useState<Set<string>>(new Set());
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  
  const canExecute = userRole === UserRole.Admin || userRole === UserRole.Operator;

  useEffect(() => {
    if (playbooks.length > 0 && !selectedPlaybook && !isBulkMode) {
      setSelectedPlaybook(playbooks[0]);
    }
    if (vms.length > 0 && !selectedVmId) {
      setSelectedVmId(vms[0].id);
    }
  }, [playbooks, vms, selectedPlaybook, selectedVmId, isBulkMode]);

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
  
  const handlePlaybookToggle = (id: string) => {
    setSelectedPlaybookIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const handleVmToggle = (id: string) => {
    setSelectedVmIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleExecute = () => {
    if (!selectedPlaybook || !selectedVmId || !canExecute) return;
    setIsExecuting(true);
    setExecutionLog('');
    // Simulate execution
    const vm = vms.find(v => v.id === selectedVmId);
    if (!vm) return;

    const log = `
SIMULATING PLAYBOOK EXECUTION
-----------------------------
Playbook: ${selectedPlaybook.name}
Target VM: ${vm.name} (${vm.host})
User: ${userRole}
Timestamp: ${new Date().toISOString()}

PLAY [Simulated Play] ********************************************

TASK [Gathering Facts] *******************************************
ok: [${vm.name}]

TASK [Simulated Task 1] ******************************************
changed: [${vm.name}]

TASK [Simulated Task 2] ******************************************
ok: [${vm.name}]

PLAY RECAP *******************************************************
${vm.name} : ok=3 changed=1 unreachable=0 failed=0 skipped=0
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
        vmName: vm.name,
        timestamp: new Date().toISOString(),
        output: log,
      };
      onSaveResult(result);
    }, 2000);
  };

  const handleBulkExecute = async () => {
    if (!canExecute || selectedPlaybookIds.size === 0 || selectedVmIds.size === 0) return;
    
    setIsBulkExecuting(true);
    setExpandedResultId(null);

    const playbooksToRun = playbooks.filter(p => selectedPlaybookIds.has(p.id));
    const vmsToRun = vms.filter(v => selectedVmIds.has(v.id));

    const initialResults: BulkResult[] = playbooksToRun.flatMap(playbook =>
      vmsToRun.map(vm => ({
        id: `${playbook.id}-${vm.id}-${Math.random()}`,
        playbook,
        vm,
        status: 'pending',
      }))
    );
    setBulkResults(initialResults);

    for (const result of initialResults) {
      setBulkResults(prev => prev.map(r => r.id === result.id ? { ...r, status: 'executing' } : r));

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate execution time

      const log = `
SIMULATING PLAYBOOK EXECUTION
-----------------------------
Playbook: ${result.playbook.name}
Target VM: ${result.vm.name} (${result.vm.host})
User: ${userRole}
Timestamp: ${new Date().toISOString()}
      
PLAY RECAP [${result.vm.name}] ************
ok=3 changed=1 unreachable=0 failed=0 skipped=0
`;
      onSaveResult({
        id: `res-bulk-${Date.now()}-${Math.random()}`,
        playbookId: result.playbook.id,
        playbookName: result.playbook.name,
        vmId: result.vm.id,
        vmName: result.vm.name,
        timestamp: new Date().toISOString(),
        output: log,
      });

      setBulkResults(prev => prev.map(r => r.id === result.id ? { ...r, status: 'success', output: log } : r));
    }
    setIsBulkExecuting(false);
  };
  
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    // Reset selections when toggling mode
    setSelectedPlaybook(isBulkMode && playbooks.length > 0 ? playbooks[0] : null);
    setExecutionLog('');
    setAnalysis('');
    setSelectedPlaybookIds(new Set());
    setSelectedVmIds(new Set());
    setBulkResults([]);
  }

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
                    onClick={() => isBulkMode ? handlePlaybookToggle(p.id) : handleSelectPlaybook(p)}
                    className={`p-3 rounded-md cursor-pointer transition-colors flex items-center ${
                      isBulkMode 
                        ? (selectedPlaybookIds.has(p.id) ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700')
                        : (selectedPlaybook?.id === p.id ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700')
                    }`}>
                   {isBulkMode && <input type="checkbox" checked={selectedPlaybookIds.has(p.id)} readOnly className="mr-3 h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"/>}
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-gray-400">{p.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card>
           <div className="flex justify-between items-center mb-4">
             <h4 className="text-lg font-semibold">{isBulkMode ? "Bulk Execution" : "On-Demand Execution"}</h4>
             <Button variant="secondary" onClick={toggleBulkMode} className="text-xs py-1 px-2">
               {isBulkMode ? "Single Mode" : "Bulk Mode"}
             </Button>
           </div>
          
          {!isBulkMode ? (
            <>
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
            </>
          ) : (
            <>
              <div className="space-y-3">
                 <p className="text-sm text-gray-400">Select VMs to target:</p>
                 <div className="max-h-32 overflow-y-auto space-y-2 bg-gray-800 p-2 rounded-md border border-gray-700">
                    {vms.map(vm => (
                       <label key={vm.id} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-700 cursor-pointer">
                          <input type="checkbox" checked={selectedVmIds.has(vm.id)} onChange={() => handleVmToggle(vm.id)} disabled={!canExecute} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"/>
                          <span>{vm.name}</span>
                       </label>
                    ))}
                 </div>
                 <Button onClick={handleBulkExecute} disabled={isBulkExecuting || !canExecute || selectedPlaybookIds.size === 0 || selectedVmIds.size === 0}>
                   {isBulkExecuting ? <Spinner size="sm"/> : `Run Selected (${selectedPlaybookIds.size} on ${selectedVmIds.size} VMs)`}
                 </Button>
                 {!canExecute && <p className="text-sm text-yellow-400">You do not have permission to execute playbooks.</p>}
              </div>
            </>
          )}

        </Card>
      </div>

      {/* --- Right Column --- */}
      <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2">
        {selectedPlaybook && !isBulkMode ? (
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
        ) : bulkResults.length > 0 ? (
          <Card>
            <h3 className="text-xl font-bold mb-4">Bulk Execution Results</h3>
            <div className="space-y-2">
              {bulkResults.map(result => (
                <div key={result.id} className="bg-gray-800 p-3 rounded-md border border-gray-700">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedResultId(expandedResultId === result.id ? null : result.id)}>
                    <div>
                      <span className="font-semibold">{result.playbook.name}</span> on <span className="font-semibold">{result.vm.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                          result.status === 'success' ? 'bg-green-500 text-white' :
                          result.status === 'executing' ? 'bg-blue-500 text-white' :
                          result.status === 'failed' ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-200'
                      }`}>
                        {result.status}
                      </span>
                      {result.output && (
                         <svg className={`w-5 h-5 transition-transform ${expandedResultId === result.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      )}
                    </div>
                  </div>
                  {expandedResultId === result.id && result.output && (
                    <pre className="mt-3 bg-gray-900 p-3 rounded-md overflow-x-auto font-mono text-sm text-green-400 border border-gray-600">
                      <code>{result.output}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <p className="text-gray-500">{isBulkMode ? 'Select playbooks and VMs to begin a bulk execution.' : 'Select a playbook to view details.'}</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlaybookManager;
