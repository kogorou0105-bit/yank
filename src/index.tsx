#!/usr/bin/env node

import {render} from 'ink';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {App} from './App.js';
import {printCommandStore} from './commands.js';
import {printHelp} from './help.js';
import {loadCommandStore} from './storage.js';

const args = process.argv.slice(2).filter(arg => arg !== '--');
const require = createRequire(import.meta.url);
const {version} = require('../package.json') as {version: string};

async function run() {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(version);
    return;
  }

  if (args[0] === 'ls' || args[0] === 'list') {
    const store = await loadCommandStore();

    printCommandStore(store);
    return;
  }

  let commandToRun = '';
  const app = render(<App onRunCommand={command => {
    commandToRun = command;
  }} />);

  await app.waitUntilExit();

  if (commandToRun) {
    await runShellCommand(commandToRun);
  }
}

async function runShellCommand(command: string) {
  console.log(`$ ${command}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, {shell: true, stdio: 'inherit'});

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }

      if (code && code !== 0) {
        process.exitCode = code;
      }

      resolve();
    });
  });
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
