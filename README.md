# yank

Personal command picker for the terminal.

`yank` stores frequently used commands, lets you pick one in an Ink-powered TUI, and copies the final command to your clipboard. Commands can include template variables like `{{componentPath}}` and `{{packageName}}`.

## Install

```bash
npm install -g yank-command
```

Then run:

```bash
yank
```

## Develop Locally

```bash
pnpm install
pnpm build
npm link
```

Then run:

```bash
yank
```

## Commands

```bash
yank          # open interactive picker
yank ls       # list saved commands
yank --help   # show help
```

## Publish

```bash
npm login --registry=https://registry.npmjs.org
npm publish --registry=https://registry.npmjs.org
```

The npm package name is `yank-command`, while the installed CLI command is `yank`.

## Keybindings

```text
Up/Down or j/k  Select command
Enter           Copy selected command and exit, or fill template variables
/               Search commands
a               Add command
e               Edit selected command
d               Delete selected command after confirmation
q or Esc        Exit
```

Input editing:

```text
Text editing uses normal terminal input behavior.
Backspace/Delete, cursor movement, long press, and paste are handled by the input component.
```

## Templates

Use `{{variableName}}` inside a command:

```bash
pnpm emo build {{packageName}} --skipCache --dependencies
```

When selected, `yank` prompts for each variable before copying the rendered command.

Variable values are saved locally at:

```text
~/.command-helper/variables.json
```

Saved commands are stored locally at:

```text
~/.command-helper/commands.json
```
