
import { Playbook, VM, ExecutionResult } from './types';

export const mockPlaybooks: Playbook[] = [
  {
    id: '1',
    name: 'check-nifi-env.yml',
    content: `
- name: Check NiFi Environment
  hosts: nifi_servers
  become: yes
  tasks:
    - name: Check for JAVA_HOME
      ansible.builtin.shell: echo $JAVA_HOME
      register: java_home
      changed_when: false

    - name: Display JAVA_HOME
      ansible.builtin.debug:
        msg: "JAVA_HOME is set to {{ java_home.stdout }}"
`,
    description: 'Verifies the JAVA_HOME environment variable on NiFi servers.'
  },
  {
    id: '2',
    name: 'setup-python-venv.yml',
    content: `
- name: Setup Python Virtual Environment
  hosts: all
  tasks:
    - name: Ensure python3-venv is installed
      ansible.builtin.apt:
        name: python3-venv
        state: present
      become: yes

    - name: Create virtual environment
      ansible.builtin.command: python3 -m venv /opt/myapp_venv
      args:
        creates: /opt/myapp_venv/bin/activate
`,
    description: 'Installs python3-venv and creates a virtual environment.'
  },
];

export const mockVms: VM[] = [
  { id: 'vm-prod-1', name: 'PROD-Web-01', host: '10.0.1.10', user: 'ansible' },
  { id: 'vm-prod-2', name: 'PROD-DB-01', host: '10.0.1.20', user: 'ansible' },
  { id: 'vm-uat-1', name: 'UAT-Web-01', host: '10.0.2.10', user: 'ansible' },
  { id: 'vm-standby-1', name: 'PROD-Standby-Web-01', host: '10.0.3.10', user: 'ansible' },
];

export const mockExecutionResults: ExecutionResult[] = [
  {
    id: 'res-1',
    playbookId: '1',
    playbookName: 'check-nifi-env.yml',
    vmId: 'vm-prod-1',
    vmName: 'PROD-Web-01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    output: `
PLAY [Check NiFi Environment] *************************************************

TASK [Gathering Facts] *********************************************************
ok: [10.0.1.10]

TASK [Check for JAVA_HOME] *****************************************************
changed: [10.0.1.10]

TASK [Display JAVA_HOME] *******************************************************
ok: [10.0.1.10] => {
    "msg": "JAVA_HOME is set to /usr/lib/jvm/java-11-openjdk-amd64"
}

PLAY RECAP *********************************************************************
10.0.1.10                  : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
`
  },
  {
    id: 'res-2',
    playbookId: '1',
    playbookName: 'check-nifi-env.yml',
    vmId: 'vm-uat-1',
    vmName: 'UAT-Web-01',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    output: `
PLAY [Check NiFi Environment] *************************************************

TASK [Gathering Facts] *********************************************************
ok: [10.0.2.10]

TASK [Check for JAVA_HOME] *****************************************************
changed: [10.0.2.10]

TASK [Display JAVA_HOME] *******************************************************
ok: [10.0.2.10] => {
    "msg": "JAVA_HOME is set to /usr/lib/jvm/java-8-openjdk-amd64"
}

PLAY RECAP *********************************************************************
10.0.2.10                  : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
`
  },
    {
    id: 'res-3',
    playbookId: '1',
    playbookName: 'check-nifi-env.yml',
    vmId: 'vm-standby-1',
    vmName: 'PROD-Standby-Web-01',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    output: `
PLAY [Check NiFi Environment] *************************************************

TASK [Gathering Facts] *********************************************************
ok: [10.0.3.10]

TASK [Check for JAVA_HOME] *****************************************************
changed: [10.0.3.10]

TASK [Display JAVA_HOME] *******************************************************
ok: [10.0.3.10] => {
    "msg": "JAVA_HOME is set to /usr/lib/jvm/java-11-openjdk-amd64"
}

PLAY RECAP *********************************************************************
10.0.3.10                  : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
`
  },
];
