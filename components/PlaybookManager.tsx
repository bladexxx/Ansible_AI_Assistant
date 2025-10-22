
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Playbook, VM, ExecutionResult } from '../types';
import { analyzePlaybook } from '../services/geminiService';
import { DEFAULT_GROUP_NAME } from '../constants';
import Button from './common/Button';
import Card from './common/Card';
import Spinner from './common/Spinner';

interface PlaybookManagerProps {
  userRole: UserRole;
  playbooks: Playbook[];
  vms: VM[];
  onSaveResult: (result: ExecutionResult) => void;
  onUpdatePlaybook: (playbook: Playbook) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  onDeleteGroup: (groupName: string) => void;
}

interface BulkResult {
  id: string;
  playbook: Playbook;
  vm: VM;
  status: 'pending' | 'executing' | 'success' | 'failed';
  output?: string;
}

const PlaybookManager: React.FC<PlaybookManagerProps> = ({ userRole, playbooks, vms, onSaveResult, onUpdatePlaybook, onRenameGroup, onDeleteGroup }) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  
  const [selectedVmId, setSelectedVmId] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState('');
  
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedPlaybookIds, setSelectedPlaybookIds] = useState<Set<string>>(new Set());
  const [selectedVmIds, setSelectedVmIds] = useState<Set<string>>(new Set());
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedGroup, setEditedGroup] = useState('');
  const [executionParams, setExecutionParams] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  const canExecute = userRole === UserRole.Admin || userRole === UserRole.Operator;
  const canEdit = userRole === UserRole.Admin;

  const { groupedPlaybooks, allGroupNames } = useMemo(() => {
    const groups = playbooks.reduce((acc, playbook) => {
      const groupName = playbook.group || DEFAULT_GROUP_NAME;
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(playbook);
      return acc;
    }, {} as Record<string, Playbook[]>);
    
    // Sort groups alphabetically, keeping Default first if it exists
    const sortedGroupNames = Object.keys(groups).sort((a, b) => {
      if (a === DEFAULT_GROUP_NAME) return -1;
      if (b === DEFAULT_GROUP_NAME) return 1;
      return a.localeCompare(b);
    });
    
    const sortedGroups: Record<string, Playbook[]> = {};
    for (const name of sortedGroupNames) {
      sortedGroups[name] = groups[name];
    }
    
    const allNames = [...new Set(playbooks.map(p => p.group).filter(Boolean) as string[])];

    if (Object.keys(openGroups).length === 0 && Object.keys(groups).length > 0) {
      const initialOpenState = Object.keys(groups).reduce((acc, groupName) => {
        acc[groupName] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setOpenGroups(initialOpenState);
    }

    // FIX: Correctly return `allNames` as `allGroupNames` to prevent a crash when mapping.
    return { groupedPlaybooks: sortedGroups, allGroupNames: allNames };
  }, [playbooks]);
  
  useEffect(() => {
    if (playbooks.length > 0 && !selectedPlaybook && !isBulkMode) {
      const firstGroupKey = Object.keys(groupedPlaybooks)[0];
      if (firstGroupKey && groupedPlaybooks[firstGroupKey].length > 0) {
        setSelectedPlaybook(groupedPlaybooks[firstGroupKey][0]);
      }
    }
    if (vms.length > 0 && !selectedVmId) {
      setSelectedVmId(vms[0].id);
    }
  }, [playbooks, vms, selectedPlaybook, selectedVmId, isBulkMode, groupedPlaybooks]);

  useEffect(() => {
    if (selectedPlaybook && !isEditing) {
      setEditedContent(selectedPlaybook.content);
      setEditedDescription(selectedPlaybook.description || '');
      setEditedGroup(selectedPlaybook.group || '');
    }
  }, [selectedPlaybook, isEditing]);

  const handleSelectPlaybook = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setAnalysis('');
    setExecutionLog('');
    setIsEditing(false);
  };

  const handleAnalyze = async () => {
    if (!selectedPlaybook) return;
    setIsLoadingAnalysis(true);
    const result = await analyzePlaybook(selectedPlaybook.content);
    setAnalysis(result);
    setIsLoadingAnalysis(false);
  };

  const handleExecute = () => {
    // ... (rest of the function is unchanged)
    if (!selectedPlaybook || !selectedVmId || !canExecute) return;
    setIsExecuting(true);
    setExecutionLog('');
    const vm = vms.find(v => v.id === selectedVmId);
    if (!vm) return;

    const log = `
SIMULATING PLAYBOOK EXECUTION
-----------------------------
Playbook: ${selectedPlaybook.name}
Target VM: ${vm.name} (${vm.host})
User: ${userRole}
Timestamp: ${new Date().toISOString()}
Extra Variables:
${executionParams || 'None'}
-----------------------------

PLAY [Simulated Play] ********************************************
...
PLAY RECAP *******************************************************
${vm.name} : ok=3 changed=1 unreachable=0 failed=0 skipped=0
`;
    
    setTimeout(() => {
      setExecutionLog(log);
      setIsExecuting(false);
      onSaveResult({
        id: `res-${Date.now()}`,
        playbookId: selectedPlaybook.id,
        playbookName: selectedPlaybook.name,
        vmId: selectedVmId,
        vmName: vm.name,
        timestamp: new Date().toISOString(),
        output: log,
      });
    }, 2000);
  };

  const handleBulkExecute = async () => {
    // ... (rest of the function is unchanged)
    if (!canExecute || selectedPlaybookIds.size === 0 || selectedVmIds.size === 0) return;
    setIsBulkExecuting(true);
    setExpandedResultId(null);
    const playbooksToRun = playbooks.filter(p => selectedPlaybookIds.has(p.id));
    const vmsToRun = vms.filter(v => selectedVmIds.has(v.id));

    const initialResults: BulkResult[] = playbooksToRun.flatMap(playbook =>
      vmsToRun.map(vm => ({ id: `${playbook.id}-${vm.id}-${Math.random()}`, playbook, vm, status: 'pending' }))
    );
    setBulkResults(initialResults);

    for (const result of initialResults) {
      setBulkResults(prev => prev.map(r => r.id === result.id ? { ...r, status: 'executing' } : r));
      await new Promise(resolve => setTimeout(resolve, 1500));
      const log = `
SIMULATING PLAYBOOK EXECUTION
-----------------------------
Playbook: ${result.playbook.name}
Target VM: ${result.vm.name} (${result.vm.host})
User: ${userRole}
Timestamp: ${new Date().toISOString()}
Extra Variables:
${executionParams || 'None'}
-----------------------------

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

  const handleSaveEdit = () => {
    if (!selectedPlaybook || !canEdit) return;
    onUpdatePlaybook({
      ...selectedPlaybook,
      content: editedContent,
      description: editedDescription,
      group: editedGroup || DEFAULT_GROUP_NAME,
    });
    setIsEditing(false);
  };
  
  const toggleGroup = (groupName: string) => {
    if (renamingGroup === groupName) return;
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };
  
  const handleRenameGroup = () => {
    if (!renamingGroup) return;
    onRenameGroup(renamingGroup, newGroupName);
    setRenamingGroup(null);
    setNewGroupName('');
  };

  const handleDeleteGroup = (groupName: string) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}"? All playbooks inside will be moved to the "${DEFAULT_GROUP_NAME}" group.`)) {
      onDeleteGroup(groupName);
    }
  };

  const renderPlaybookList = () => (
    <ul className="space-y-2">
      {Object.entries(groupedPlaybooks).map(([groupName, groupPlaybooks]) => (
        <li key={groupName}>
          <div className="flex items-center justify-between p-2 font-semibold text-lg text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700">
             {renamingGroup === groupName ? (
              <div className="flex-grow flex items-center gap-2">
                 <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup()}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-lg w-full"
                    autoFocus
                  />
                  <Button onClick={handleRenameGroup} className="p-1 h-8 w-8 flex-shrink-0">✓</Button>
                  <Button variant="secondary" onClick={() => setRenamingGroup(null)} className="p-1 h-8 w-8 flex-shrink-0">×</Button>
              </div>
             ) : (
                <>
                <div className="flex items-center cursor-pointer flex-grow" onClick={() => toggleGroup(groupName)}>
                    <svg className={`w-5 h-5 transition-transform mr-2 ${openGroups[groupName] ? 'rotate-0' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    <span>{groupName}</span>
                </div>
                {groupName !== DEFAULT_GROUP_NAME && canEdit && (
                    <div className="relative group">
                    <button className="p-1 rounded-full hover:bg-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 hidden group-hover:block">
                        <a href="#" onClick={(e) => { e.preventDefault(); setRenamingGroup(groupName); setNewGroupName(groupName); }} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Rename</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteGroup(groupName); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Delete</a>
                    </div>
                    </div>
                )}
                </>
             )}
          </div>
          {openGroups[groupName] && (
            <ul className="pl-2 pt-2 space-y-2">
              {groupPlaybooks.map(p => (
                <li key={p.id} 
                    onClick={() => isBulkMode ? setSelectedPlaybookIds(prev => new Set(prev).add(p.id)) : handleSelectPlaybook(p)}
                    className={`p-3 rounded-md cursor-pointer transition-colors flex items-center ${
                      isBulkMode 
                        ? (selectedPlaybookIds.has(p.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600')
                        : (selectedPlaybook?.id === p.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600')
                    }`}>
                  {isBulkMode && <input type="checkbox" checked={selectedPlaybookIds.has(p.id)} onChange={() => setSelectedPlaybookIds(prev => { const s = new Set(prev); s.has(p.id) ? s.delete(p.id) : s.add(p.id); return s; })} className="mr-3 h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"/>}
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-gray-400">{p.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-6">
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="flex flex-col flex-1 min-h-0">
          <h2 className="text-2xl font-bold mb-4">Available Playbooks</h2>
          <Card className="flex-1 overflow-y-auto">{renderPlaybookList()}</Card>
        </div>
        <Card>
           <div className="flex justify-between items-center mb-4">
             <h4 className="text-lg font-semibold">{isBulkMode ? "Bulk Execution" : "On-Demand Execution"}</h4>
             <Button variant="secondary" onClick={() => setIsBulkMode(!isBulkMode)} className="text-xs py-1 px-2">
               {isBulkMode ? "Single Mode" : "Bulk Mode"}
             </Button>
           </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">Extra Variables (YAML format)</label>
              <textarea value={executionParams} onChange={e => setExecutionParams(e.target.value)} placeholder="key: value" rows={3} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 font-mono text-sm"/>
            </div>
            {!isBulkMode ? (
              <>
                <div className="flex items-center space-x-4">
                  <select value={selectedVmId} onChange={e => setSelectedVmId(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white w-full" disabled={!canExecute}>
                    {vms.map(vm => <option key={vm.id} value={vm.id}>{vm.name}</option>)}
                  </select>
                  <Button onClick={handleExecute} disabled={isExecuting || !canExecute}>{isExecuting ? "..." : "Execute"}</Button>
                </div>
                {!canExecute && <p className="text-sm text-yellow-400">You do not have permission to execute.</p>}
                {isExecuting ? <Spinner /> : executionLog && <pre className="bg-gray-900 p-4 rounded-md overflow-x-auto font-mono text-sm text-green-400 border border-gray-700 max-h-48"><code>{executionLog}</code></pre>}
              </>
            ) : (
              <>
                 <label className="text-sm font-medium text-gray-400">Select VMs to target:</label>
                 <div className="max-h-32 overflow-y-auto space-y-2 bg-gray-800 p-2 rounded-md border border-gray-700">
                    {vms.map(vm => (<label key={vm.id} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-700 cursor-pointer"><input type="checkbox" checked={selectedVmIds.has(vm.id)} onChange={() => setSelectedVmIds(prev => { const s = new Set(prev); s.has(vm.id) ? s.delete(vm.id) : s.add(vm.id); return s; })} disabled={!canExecute} className="h-4 w-4 rounded"/><span>{vm.name}</span></label>))}
                 </div>
                 <Button onClick={handleBulkExecute} disabled={isBulkExecuting || !canExecute || selectedPlaybookIds.size === 0 || selectedVmIds.size === 0}>
                   {isBulkExecuting ? <Spinner size="sm"/> : `Run Selected (${selectedPlaybookIds.size} on ${selectedVmIds.size} VMs)`}
                 </Button>
                 {!canExecute && <p className="text-sm text-yellow-400">You do not have permission to execute.</p>}
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2">
        {selectedPlaybook && !isBulkMode ? (
          <>
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{selectedPlaybook.name}</h3>
                {canEdit && !isEditing && <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit</Button>}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                   <div><label className="text-sm font-medium">Description</label><input type="text" value={editedDescription} onChange={e => setEditedDescription(e.target.value)} className="w-full bg-gray-800 p-2 rounded border border-gray-600" /></div>
                   <div>
                      <label className="text-sm font-medium" htmlFor="playbook-group">Group</label>
                      <input list="group-names" id="playbook-group" type="text" value={editedGroup} onChange={e => setEditedGroup(e.target.value)} className="w-full bg-gray-800 p-2 rounded border border-gray-600" />
                      <datalist id="group-names">
                        {allGroupNames.map(name => <option key={name} value={name} />)}
                      </datalist>
                   </div>
                   <div><label className="text-sm font-medium">Content (YAML)</label><textarea value={editedContent} onChange={e => setEditedContent(e.target.value)} rows={15} className="w-full bg-gray-800 p-2 rounded font-mono text-sm border border-gray-600"/></div>
                   <div className="flex gap-4"><Button onClick={handleSaveEdit}>Save Changes</Button><Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button></div>
                </div>
              ) : (
                <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto font-mono text-sm max-h-96 border border-gray-700"><code>{selectedPlaybook.content}</code></pre>
              )}
            </Card>
            {!isEditing && <Card>
              <h4 className="text-xl font-semibold mb-4">AI Analysis & Validation</h4>
              {isLoadingAnalysis ? <Spinner /> : analysis ? <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{__html: analysis.replace(/\n/g, '<br />') }}/> : <Button onClick={handleAnalyze}>Analyze with AI</Button>}
            </Card>}
          </>
        ) : bulkResults.length > 0 ? (
          <Card>
            <h3 className="text-xl font-bold mb-4">Bulk Execution Results</h3>
            <div className="space-y-2">
              {bulkResults.map(result => (
                <div key={result.id} className="bg-gray-800 p-3 rounded-md border border-gray-700">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedResultId(expandedResultId === result.id ? null : result.id)}>
                    <div><span className="font-semibold">{result.playbook.name}</span> on <span className="font-semibold">{result.vm.name}</span></div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${result.status === 'success' ? 'bg-green-500' : result.status === 'executing' ? 'bg-blue-500' : 'bg-gray-600'}`}>{result.status}</span>
                      {result.output && <svg className={`w-5 h-5 transition-transform ${expandedResultId === result.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>}
                    </div>
                  </div>
                  {expandedResultId === result.id && result.output && <pre className="mt-3 bg-gray-900 p-3 rounded-md overflow-x-auto font-mono text-sm text-green-400 border border-gray-600"><code>{result.output}</code></pre>}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full"><p className="text-gray-500">{isBulkMode ? 'Select playbooks and VMs to begin.' : 'Select a playbook to view details.'}</p></Card>
        )}
      </div>
    </div>
  );
};

export default PlaybookManager;
