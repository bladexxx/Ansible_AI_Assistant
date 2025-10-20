
import React, { useState } from 'react';
import { generatePlaybook } from '../services/geminiService';
import { UserRole, Playbook } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import Spinner from './common/Spinner';

interface PlaybookGeneratorProps {
  userRole: UserRole;
  onPlaybookGenerated: (playbook: Playbook) => void;
}

const PlaybookGenerator: React.FC<PlaybookGeneratorProps> = ({ userRole, onPlaybookGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedPlaybook, setGeneratedPlaybook] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playbookName, setPlaybookName] = useState('');

  const canGenerate = userRole === UserRole.Admin || userRole === UserRole.Operator;

  const handleGenerate = async () => {
    if (!prompt || !canGenerate) return;
    setIsLoading(true);
    setGeneratedPlaybook('');
    const playbookContent = await generatePlaybook(prompt);
    setGeneratedPlaybook(playbookContent);
    setIsLoading(false);
  };

  const handleSave = () => {
    if (!generatedPlaybook || !playbookName) return;
    const newPlaybook: Playbook = {
      id: `playbook-${Date.now()}`,
      name: playbookName.endsWith('.yml') ? playbookName : `${playbookName}.yml`,
      content: generatedPlaybook,
      description: `AI generated for: "${prompt}"`
    };
    onPlaybookGenerated(newPlaybook);
    setGeneratedPlaybook('');
    setPlaybookName('');
    setPrompt('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">AI Playbook Generator</h2>
      <Card>
        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
              Describe the task for the playbook:
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Install nginx and start the service on all web servers'"
              className="w-full bg-gray-800 border border-gray-600 rounded-md p-3 text-white focus:ring-blue-500 focus:border-blue-500 font-mono"
              rows={4}
              disabled={!canGenerate}
            />
          </div>
          <Button onClick={handleGenerate} disabled={isLoading || !prompt || !canGenerate}>
            {isLoading ? <Spinner size="sm" /> : 'Generate Playbook'}
          </Button>
          {!canGenerate && (
            <p className="text-sm text-yellow-400">You do not have permission to generate playbooks.</p>
          )}
        </div>
      </Card>

      {(isLoading || generatedPlaybook) && (
        <Card>
          <h3 className="text-xl font-semibold mb-4">Generated Playbook</h3>
          {isLoading && <Spinner />}
          {generatedPlaybook && (
            <div className="space-y-4">
              <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto font-mono text-sm text-gray-200 border border-gray-700">
                <code>{generatedPlaybook}</code>
              </pre>
              <div className="flex items-center space-x-4">
                 <input
                  type="text"
                  value={playbookName}
                  onChange={(e) => setPlaybookName(e.target.value)}
                  placeholder="Enter playbook name (e.g., nginx-setup.yml)"
                  className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
                <Button onClick={handleSave} disabled={!playbookName}>Save Playbook</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default PlaybookGenerator;
