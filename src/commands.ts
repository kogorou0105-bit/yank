import type {CommandItem} from './types.js';

export function printCommands(commands: CommandItem[]) {
  if (commands.length === 0) {
    console.log('No commands saved.');
    return;
  }

  for (const [index, item] of commands.entries()) {
    console.log(`${index + 1}. ${item.name}`);
    console.log(`   ${item.command}`);
  }
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
