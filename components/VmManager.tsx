
import React, { useState } from 'react';
import { UserRole, VM } from '../types';
import Button from './common/Button';
import Card from './common/Card';

interface VmManagerProps {
  userRole: UserRole;
  vms: VM[];
  setVms: React.Dispatch<React.SetStateAction<VM[]>>;
}

const VmManager: React.FC<VmManagerProps> = ({ userRole, vms, setVms }) => {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [user, setUser] = useState('');
  
  const canManage = userRole === UserRole.Admin;

  const handleAddVm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !host || !user || !canManage) return;
    const newVm: VM = {
      id: `vm-${Date.now()}`,
      name,
      host,
      user,
    };
    setVms([...vms, newVm]);
    setName('');
    setHost('');
    setUser('');
  };

  const handleDeleteVm = (id: string) => {
    if (!canManage) return;
    setVms(vms.filter(vm => vm.id !== id));
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">VM Environment Management</h2>
      
      {canManage && (
        <Card>
          <h3 className="text-xl font-semibold mb-4">Add New VM</h3>
          <form onSubmit={handleAddVm} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">VM Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="PROD-API-01" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">Host/IP</label>
              <input type="text" value={host} onChange={e => setHost(e.target.value)} placeholder="10.0.1.50" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-400">Username</label>
              <input type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="ansible_user" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <Button type="submit">Add VM</Button>
          </form>
        </Card>
      )}

      {!canManage && (
        <Card>
          <p className="text-yellow-400">You do not have permission to manage VMs. View only.</p>
        </Card>
      )}

      <Card>
        <h3 className="text-xl font-semibold mb-4">Registered VMs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Host/IP</th>
                <th className="p-3">User</th>
                {canManage && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {vms.map(vm => (
                <tr key={vm.id} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="p-3">{vm.name}</td>
                  <td className="p-3 font-mono">{vm.host}</td>
                  <td className="p-3">{vm.user}</td>
                  {canManage && (
                    <td className="p-3 text-right">
                      <Button variant="danger" onClick={() => handleDeleteVm(vm.id)}>Delete</Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default VmManager;
