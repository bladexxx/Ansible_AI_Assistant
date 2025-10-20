
export enum UserRole {
  Admin = 'Admin',
  Operator = 'Operator',
  Developer = 'Developer',
}

export type Page = 'generator' | 'manager' | 'vms' | 'comparator';

export interface Playbook {
  id: string;
  name: string;
  content: string;
  description?: string;
}

export interface VM {
  id: string;
  name: string;
  host: string;
  user: string;
}

export interface ExecutionResult {
  id: string;
  playbookId: string;
  playbookName: string;
  vmId: string;
  vmName: string;
  timestamp: string;
  output: string;
}
