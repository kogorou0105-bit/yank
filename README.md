# yank ⚡️

Your personal command picker for the terminal.

`yank` keeps frequently used commands one shortcut away. Open the Ink-powered TUI, search or edit your saved commands, fill any template variables, and copy the final command straight to your clipboard.

## ✨ Features

- Fast interactive command picker powered by Ink
- Local command storage with add, edit, delete, and list flows
- Search by command name or command text
- Template variables like `{{componentPath}}` and `{{packageName}}`
- Clipboard-first workflow: pick a command, fill values, paste wherever you need it

## 🚀 Install

```bash
npm install -g yank-command
```

Then launch the picker:

```bash
yank
```

The npm package name is `yank-command`, while the installed CLI command is `yank`.

## 🧰 Commands

```bash
yank             # open interactive picker
yank ls          # list saved commands
yank --help      # show help
yank --version   # show version
```

## ⌨️ Keybindings

```text
Up/Down or j/k  Select command
Enter           Copy selected command and exit, or fill template variables
/               Search commands
a               Add command
e               Edit selected command
d               Delete selected command after confirmation
q or Esc        Exit
```

Text input uses normal terminal editing behavior. Backspace/Delete, cursor movement, long press, and paste are handled by the input component.

## 🧩 Templates

Use `{{variableName}}` inside a command:

```bash
pnpm emo build {{packageName}} --skipCache --dependencies
```

When that command is selected, `yank` prompts for each variable before copying the rendered result.

Previously entered variable values are saved locally at:

```text
~/.command-helper/variables.json
```

Saved commands are stored locally at:

```text
~/.command-helper/commands.json
```

## 🛠 Develop Locally

```bash
pnpm install
pnpm build
npm link
```

Then run the linked CLI:

```bash
yank
```

## 📦 Publish

```bash
npm login --registry=https://registry.npmjs.org
npm publish --registry=https://registry.npmjs.org
```
