# yank ⚡️

Your personal command picker for the terminal.

`yank` keeps frequently used commands one shortcut away. Open the Ink-powered TUI, search or edit your saved commands, fill any template variables, then copy the final command to your clipboard or run it.

## ✨ Features

- Fast interactive command picker powered by Ink
- Category-based command storage with add, edit, delete, and list flows
- Left/Right category switching for Home, Git, System, and Install
- Search by command name or command text in the current category
- Template variables like `{{componentPath}}` and `{{packageName}}`
- Clipboard-first workflow by default, with opt-in command execution

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
Left/Right      Switch command category
Up/Down or j/k  Select command in the current category
Enter           Copy or run selected command, or fill template variables
/               Search commands in the current category
a               Add command to the current category
e               Edit selected command in the current category
d               Delete selected command from the current category after confirmation
t               Toggle selected command between copy and run
q or Esc        Exit
```

Text input uses normal terminal editing behavior. Backspace/Delete, cursor movement, long press, and paste are handled by the input component.

## 🧩 Templates

Use `{{variableName}}` inside a command:

```bash
pnpm emo build {{packageName}} --skipCache --dependencies
```

When that command is selected, `yank` prompts for each variable before copying or running the rendered result.

## ▶️ Actions

Each command has an action:

```text
copy  Copy the command to clipboard and exit
run   Run the command in your shell after the TUI exits
```

Commands default to `copy`. Press `t` on the selected command to toggle between `copy` and `run`.

When adding or editing a command, `yank` asks you to choose `copy` or `run` before saving. Use Left/Right or `t` to switch, `c`/`r` to choose directly, and Enter to save.

Previously entered variable values are saved locally at:

```text
~/.command-helper/variables.json
```

Saved commands are stored locally at:

```text
~/.command-helper/commands.json
```

Commands are grouped by category. New installations and existing stores include `Home`, `Git`, `System`, and `Install`; existing flat command lists are migrated into `Home` automatically. The old `Tools` category is migrated into `Install`.

Default `System` and `Install` commands are generated for the current OS on first run:

- Windows uses `dir`, PowerShell, `winget`, and `curl.exe` commands.
- macOS uses Unix shell commands and Homebrew-based install commands.
- Linux uses Unix shell commands plus common Debian/Ubuntu install commands where package managers are needed.

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
