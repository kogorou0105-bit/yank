import {nanoid} from 'nanoid';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {CommandCategory, CommandItem, CommandStore, Variables} from './types.js';

export const dataDir = path.join(os.homedir(), '.command-helper');
export const dataFile = path.join(dataDir, 'commands.json');
export const variablesFile = path.join(dataDir, 'variables.json');

const fixedCategories = [
  {id: 'home', name: 'Home'},
  {id: 'system', name: 'System'},
  {id: 'install', name: 'Install'}
];
const legacyCategoryIds = new Map([['tools', 'install']]);

function createDefaultStore(): CommandStore {
  const platform = os.platform();

  return {
    version: 2,
    categories: [
      {
        id: 'home',
        name: 'Home',
        commands: createHomeCommands()
      },
      {
        id: 'system',
        name: 'System',
        commands: createSystemCommands(platform)
      },
      {
        id: 'install',
        name: 'Install',
        commands: createInstallCommands(platform)
      }
    ]
  };
}

function createHomeCommands() {
  return [
    createCommand(
      'Create a Vite React app',
      'pnpm create vite {{appName}} --template react-ts && cd {{appName}} && pnpm install && pnpm dev --host 127.0.0.1'
    ),
    createCommand(
      'Run Docker Postgres locally',
      'docker run --name {{containerName}} -e POSTGRES_USER={{dbUser}} -e POSTGRES_PASSWORD={{dbPassword}} -e POSTGRES_DB={{dbName}} -p {{port}}:5432 -v {{volumeName}}:/var/lib/postgresql/data -d postgres:16'
    )
  ];
}

function createSystemCommands(platform: NodeJS.Platform) {
  if (platform === 'win32') {
    return [
      createCommand('List files with details', 'dir', 'run'),
      createCommand('Print current directory', 'cd', 'run'),
      createCommand('Show disk usage', 'powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem"', 'run'),
      createCommand(
        'Find large files in current directory',
        'powershell -NoProfile -Command "Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 20 FullName,Length"'
      ),
      createCommand(
        'Create a zip backup',
        'powershell -NoProfile -Command "Compress-Archive -Path {{directory}} -DestinationPath {{archiveName}}.zip -Force"'
      )
    ];
  }

  return [
    createCommand('List files with details', 'ls -la', 'run'),
    createCommand('Print current directory', 'pwd', 'run'),
    createCommand('Show disk usage', 'df -h', 'run'),
    createCommand(
      'Find large files in current git repo',
      'git rev-list --objects --all | git cat-file --batch-check="%(objecttype) %(objectname) %(objectsize) %(rest)" | sort -k3 -n | tail -20'
    ),
    createCommand('Create a tar.gz backup', 'tar --exclude="node_modules" --exclude=".git" -czf {{archiveName}}.tar.gz {{directory}}')
  ];
}

function createInstallCommands(platform: NodeJS.Platform) {
  if (platform === 'win32') {
    return [
      createCommand('Install latest Lark CLI', 'npx @larksuite/cli@latest install'),
      createCommand('Install Node.js LTS with winget', 'winget install OpenJS.NodeJS.LTS'),
      createCommand('Install Python with winget', 'winget install Python.Python.3.13'),
      createCommand('Enable pnpm with Corepack', 'corepack enable pnpm'),
      createCommand('Install Git with winget', 'winget install Git.Git'),
      createCommand('Install Docker Desktop with winget', 'winget install Docker.DockerDesktop'),
      createCommand('Download URL with curl.exe', 'curl.exe -L --fail --retry 5 --output {{outputFile}} {{url}}')
    ];
  }

  if (platform === 'darwin') {
    return [
      createCommand('Install latest Lark CLI', 'npx @larksuite/cli@latest install'),
      createCommand('Install Homebrew', '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'),
      createCommand('Install Node.js with Homebrew', 'brew install node'),
      createCommand('Install fnm for Node.js version management', 'curl -fsSL https://fnm.vercel.app/install | bash'),
      createCommand('Install Python with Homebrew', 'brew install python'),
      createCommand('Enable pnpm with Corepack', 'corepack enable pnpm'),
      createCommand('Install Git with Homebrew', 'brew install git'),
      createCommand('Install Docker Desktop', 'brew install --cask docker'),
      createCommand('Download URL with resume and retries', 'curl -L --fail --retry 5 --retry-delay 2 --continue-at - --output {{outputFile}} {{url}}')
    ];
  }

  return [
    createCommand('Install latest Lark CLI', 'npx @larksuite/cli@latest install'),
    createCommand('Install Node.js with fnm', 'curl -fsSL https://fnm.vercel.app/install | bash'),
    createCommand('Install Node.js on Debian/Ubuntu', 'sudo apt update && sudo apt install -y nodejs npm'),
    createCommand('Install Python on Debian/Ubuntu', 'sudo apt update && sudo apt install -y python3 python3-pip'),
    createCommand('Enable pnpm with Corepack', 'corepack enable pnpm'),
    createCommand('Install Git on Debian/Ubuntu', 'sudo apt update && sudo apt install -y git'),
    createCommand('Install Docker with official script', 'curl -fsSL https://get.docker.com | sh'),
    createCommand('Download URL with resume and retries', 'curl -L --fail --retry 5 --retry-delay 2 --continue-at - --output {{outputFile}} {{url}}')
  ];
}

function createCommand(name: string, command: string, action: CommandItem['action'] = 'copy'): CommandItem {
  return {
    id: nanoid(),
    name,
    command,
    action
  };
}

export async function loadCommandStore() {
  try {
    const content = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(content) as unknown;

    if (isCommandStore(parsed)) {
      return normalizeCommandStore(parsed);
    }

    if (isCommandList(parsed)) {
      const store = normalizeCommandStore({version: 2, categories: [{id: 'home', name: 'Home', commands: parsed}]});

      await saveCommandStore(store);

      return store;
    }

    throw new Error(`${dataFile} 格式不正确`);
  } catch (error) {
    if (isFileNotFound(error)) {
      const store = createDefaultStore();

      await saveCommandStore(store);

      return store;
    }

    throw error;
  }
}

export async function saveCommandStore(store: CommandStore) {
  await mkdir(dataDir, {recursive: true});
  await writeFile(dataFile, JSON.stringify(normalizeCommandStore(store), null, 2), 'utf8');
}

export async function loadVariables() {
  try {
    const content = await readFile(variablesFile, 'utf8');

    return JSON.parse(content) as Variables;
  } catch {
    return {};
  }
}

export async function saveVariables(variables: Variables) {
  await mkdir(dataDir, {recursive: true});
  await writeFile(variablesFile, JSON.stringify(variables, null, 2), 'utf8');
}

function normalizeCommandStore(store: CommandStore): CommandStore {
  const categoriesById = new Map<string, CommandCategory>();

  for (const category of store.categories) {
    const id = normalizeCategoryId(category.id);
    const existing = categoriesById.get(id);

    categoriesById.set(id, {
      id,
      name: getCategoryName(id) ?? category.name,
      commands: [...(existing?.commands ?? []), ...normalizeCommands(id, category.commands)]
    });
  }

  const categories: CommandCategory[] = fixedCategories.map(category => {
    const existing = categoriesById.get(category.id);

    return {
      id: category.id,
      name: category.name,
      commands: existing?.commands ?? []
    };
  });

  for (const [categoryId, category] of categoriesById) {
    if (!fixedCategories.some(item => item.id === categoryId)) {
      categories.push({...category, commands: normalizeCommands(categoryId, category.commands)});
    }
  }

  return {version: 2, categories};
}

function normalizeCommands(categoryId: string, commands: CommandItem[]) {
  return commands.map(command => {
    const normalized = normalizeCommandItem(command);

    if (categoryId === 'system' && normalized.command.trim() === 'ls -la' && normalized.action === undefined) {
      return {...normalized, action: 'run' as const};
    }

    return normalized;
  });
}

function normalizeCommandItem(command: CommandItem): CommandItem {
  return {
    id: command.id,
    name: command.name,
    command: command.command,
    ...(command.action ? {action: command.action} : {})
  };
}

function normalizeCategoryId(categoryId: string) {
  return legacyCategoryIds.get(categoryId) ?? categoryId;
}

function getCategoryName(categoryId: string) {
  return fixedCategories.find(category => category.id === categoryId)?.name;
}

function isCommandStore(value: unknown): value is CommandStore {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as {version?: unknown}).version === 2 &&
    Array.isArray((value as {categories?: unknown}).categories) &&
    (value as {categories: unknown[]}).categories.every(isCommandCategory)
  );
}

function isCommandCategory(value: unknown): value is CommandCategory {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as {id?: unknown}).id === 'string' &&
    typeof (value as {name?: unknown}).name === 'string' &&
    Array.isArray((value as {commands?: unknown}).commands) &&
    (value as {commands: unknown[]}).commands.every(isCommandItem)
  );
}

function isCommandList(value: unknown): value is CommandItem[] {
  return Array.isArray(value) && value.every(isCommandItem);
}

function isCommandItem(value: unknown): value is CommandItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as {id?: unknown}).id === 'string' &&
    typeof (value as {name?: unknown}).name === 'string' &&
    typeof (value as {command?: unknown}).command === 'string' &&
    isCommandAction((value as {action?: unknown}).action)
  );
}

function isCommandAction(value: unknown) {
  return value === undefined || value === 'copy' || value === 'run';
}

function isFileNotFound(error: unknown) {
  return typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT';
}
