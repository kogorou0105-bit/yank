export function printHelp() {
  console.log(`Command Helper

Usage:
  yank
  yank ls
  yank --help
  yank --version

Commands:
  ls              List saved commands grouped by category

Keys:
  Left/Right      Switch command category
  Up/Down or j/k  Select command
  Enter           Copy or run selected command, or fill template variables
  /               Search commands in the current category
  a               Add command to the current category
  e               Edit selected command in the current category
  d               Delete selected command from the current category after confirmation
  t               Toggle selected command between copy and run
  q or Esc        Exit

Actions:
  copy            Copy the command to clipboard and exit
  run             Run the command in your shell after the TUI exits
  c/r             Select copy/run when adding or editing a command

Templates:
  Use {{variableName}} in a command to fill that value before copy or run.

Input:
  Text editing uses normal terminal input behavior.
  Backspace/Delete, cursor movement, long press, and paste are handled by the input component.
`);
}
