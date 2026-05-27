import {nanoid} from 'nanoid';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {CommandItem, Variables} from './types.js';

export const dataDir = path.join(os.homedir(), '.command-helper');
export const dataFile = path.join(dataDir, 'commands.json');
export const variablesFile = path.join(dataDir, 'variables.json');

const defaultCommands: CommandItem[] = [
  {
    id: nanoid(),
    name: 'Create a Vite React app',
    command: 'pnpm create vite {{appName}} --template react-ts && cd {{appName}} && pnpm install && pnpm dev --host 127.0.0.1'
  },
  {
    id: nanoid(),
    name: 'Run Docker Postgres locally',
    command: 'docker run --name {{containerName}} -e POSTGRES_USER={{dbUser}} -e POSTGRES_PASSWORD={{dbPassword}} -e POSTGRES_DB={{dbName}} -p {{port}}:5432 -v {{volumeName}}:/var/lib/postgresql/data -d postgres:16'
  },
  {
    id: nanoid(),
    name: 'Find large files in current git repo',
    command: 'git rev-list --objects --all | git cat-file --batch-check="%(objecttype) %(objectname) %(objectsize) %(rest)" | sort -k3 -n | tail -20'
  },
  {
    id: nanoid(),
    name: 'Download URL with resume and retries',
    command: 'curl -L --fail --retry 5 --retry-delay 2 --continue-at - --output {{outputFile}} {{url}}'
  },
  {
    id: nanoid(),
    name: 'Create a tar.gz backup',
    command: 'tar --exclude="node_modules" --exclude=".git" -czf {{archiveName}}.tar.gz {{directory}}'
  }
];

export async function loadCommands() {
  try {
    const content = await readFile(dataFile, 'utf8');

    return JSON.parse(content) as CommandItem[];
  } catch {
    await saveCommands(defaultCommands);

    return defaultCommands;
  }
}

export async function saveCommands(commands: CommandItem[]) {
  await mkdir(dataDir, {recursive: true});
  await writeFile(dataFile, JSON.stringify(commands, null, 2), 'utf8');
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
