export type CommandAction = 'copy' | 'run';

export type CommandItem = {
  id: string;
  name: string;
  command: string;
  action?: CommandAction;
};

export type CommandCategory = {
  id: string;
  name: string;
  commands: CommandItem[];
};

export type CommandStore = {
  version: 2;
  categories: CommandCategory[];
};

export type Variables = Record<string, string>;
