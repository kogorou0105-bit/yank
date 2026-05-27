export function printHelp() {
  console.log(`Command Helper

Usage:
  yank
  yank ls
  yank --help
  yank --version

Commands:
  ls              List saved commands

Keys:
  Up/Down or j/k  Select command
  Enter           Copy selected command and exit, or fill template variables
  /               Search commands
  a               Add command
  e               Edit selected command
  d               Delete selected command after confirmation
  q or Esc        Exit

Templates:
  Use {{variableName}} in a command to fill that value before copying.

Input:
  Text editing uses normal terminal input behavior.
  Backspace/Delete, cursor movement, long press, and paste are handled by the input component.
`);
}
