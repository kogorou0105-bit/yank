import type {CommandAction, CommandItem, CommandStore} from './types.js';

export function printCommandStore(store: CommandStore) {
  if (store.categories.every(category => category.commands.length === 0)) {
    console.log('No commands saved.');
    return;
  }

  for (const category of store.categories) {
    console.log(`${category.name}:`);

    if (category.commands.length === 0) {
      console.log('  No commands saved.');
      continue;
    }

    for (const [index, item] of category.commands.entries()) {
      console.log(`  ${index + 1}. ${formatCommandAction(item)} ${item.name}`);
      console.log(`     ${item.command}`);
    }
  }
}

export function getCommandAction(command: CommandItem): CommandAction {
  return command.action ?? 'copy';
}

export function formatCommandAction(command: CommandItem | CommandAction) {
  const action = typeof command === 'string' ? command : getCommandAction(command);

  return action === 'run' ? '[▶ Run]' : '[⧉ Copy]';
}

export function filterCommands(commands: CommandItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return commands;
  }

  return commands.filter(item => {
    return item.name.toLowerCase().includes(normalizedQuery) || item.command.toLowerCase().includes(normalizedQuery);
  });
}
