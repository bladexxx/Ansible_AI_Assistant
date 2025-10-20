
import React, { useState, useMemo } from 'react';
import { ExecutionResult } from '../types';
import { compareResults } from '../services/geminiService';
import Button from './common/Button';
import Card from './common/Card';
import Spinner from './common/Spinner';

interface ResultComparatorProps {
  results: ExecutionResult[];
}

const ResultComparator: React.FC<ResultComparatorProps> = ({ results }) => {
  const [resultAId, setResultAId] = useState<string>('');
  const [resultBId, setResultBId] = useState<string>('');
  const [comparison, setComparison] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resultA = useMemo(() => results.find(r => r.id === resultAId), [results, resultAId]);
  const resultB = useMemo(() => results.find(r => r.id === resultBId), [results, resultBId]);
  
  const handleCompare = async () => {
    if (!resultA || !resultB) return;
    setIsLoading(true);
    setComparison('');
    const summary = await compareResults(resultA.output, resultB.output);
    setComparison(summary);
    setIsLoading(false);
  };
  
  const getResultDisplayName = (result: ExecutionResult) => 
    `${result.vmName} - ${result.playbookName} (${new Date(result.timestamp).toLocaleString()})`;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Execution Result Comparison</h2>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-400">Result A (e.g., PROD)</label>
            <select value={resultAId} onChange={e => setResultAId(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Result</option>
              {results.map(r => <option key={r.id} value={r.id}>{getResultDisplayName(r)}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-400">Result B (e.g., UAT / Standby)</label>
            <select value={resultBId} onChange={e => setResultBId(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select Result</option>
              {results.map(r => <option key={r.id} value={r.id}>{getResultDisplayName(r)}</option>)}
            </select>
          </div>
          <Button onClick={handleCompare} disabled={isLoading || !resultA || !resultB}>
            {isLoading ? <Spinner size="sm"/> : 'Analyze Differences'}
          </Button>
        </div>
      </Card>
      
      {(isLoading || comparison) && (
        <Card>
          <h3 className="text-xl font-semibold mb-4">AI Comparison Summary</h3>
          {isLoading && <Spinner />}
          {comparison && (
            <div className="prose prose-invert max-w-none text-gray-300 bg-gray-800 p-4 rounded-md border border-gray-700" dangerouslySetInnerHTML={{__html: comparison.replace(/\n/g, '<br />') }} />
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <h3 className="text-xl font-semibold mb-4">Result A: {resultA ? getResultDisplayName(resultA) : 'None selected'}</h3>
          <pre className="bg-gray-800 p-4 rounded-md overflow-auto font-mono text-sm text-gray-300 flex-grow border border-gray-700">
            <code>{resultA?.output || 'Select a result to display its log.'}</code>
          </pre>
        </Card>
        <Card className="flex flex-col">
          <h3 className="text-xl font-semibold mb-4">Result B: {resultB ? getResultDisplayName(resultB) : 'None selected'}</h3>
          <pre className="bg-gray-800 p-4 rounded-md overflow-auto font-mono text-sm text-gray-300 flex-grow border border-gray-700">
            <code>{resultB?.output || 'Select a result to display its log.'}</code>
          </pre>
        </Card>
      </div>
    </div>
  );
};

export default ResultComparator;
