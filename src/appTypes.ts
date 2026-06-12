export type Mode =
  | 'list'
  | 'search'
  | 'addName'
  | 'addCommand'
  | 'addAction'
  | 'editName'
  | 'editCommand'
  | 'editAction'
  | 'templateValue'
  | 'deleteConfirm';

export type AppProps = {
  onRunCommand?: (command: string) => void;
};
