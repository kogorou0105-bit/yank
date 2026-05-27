#!/usr/bin/env node

import React, {useEffect, useRef, useState} from 'react';
import clipboard from 'clipboardy';
import {Box, Text, render, useApp, useInput} from 'ink';
import {nanoid} from 'nanoid';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const version = '0.1.0';

type CommandItem = {
  id: string;
  name: string;
  command: string;
};

type Mode = 'list' | 'addName' | 'addCommand' | 'editName' | 'editCommand' | 'templateValue';

const dataDir = path.join(os.homedir(), '.command-helper');
const dataFile = path.join(dataDir, 'commands.json');
const variablesFile = path.join(dataDir, 'variables.json');

const defaultCommands: CommandItem[] = [
  {
    id: nanoid(),
    name: '安装依赖',
    command: 'pnpm install --no-frozen-lockfile'
  },
  {
    id: nanoid(),
    name: '开启组件预览',
    command: 'pnpm aic dev-component {{componentPath}} -p {{port}} --host 127.0.0.1'
  },
  {
    id: nanoid(),
    name: '构建组件',
    command: 'pnpm emo build {{packageName}} --skipCache --dependencies'
  },
  {
    id: nanoid(),
    name: '发布组件',
    command: 'pnpm aic hera publish-component {{componentPath}}'
  }
];

async function loadCommands() {
  try {
    const content = await readFile(dataFile, 'utf8');
    const commands = JSON.parse(content) as CommandItem[];

    return commands;
  } catch {
    await saveCommands(defaultCommands);

    return defaultCommands;
  }
}

async function saveCommands(commands: CommandItem[]) {
  await mkdir(dataDir, {recursive: true});
  await writeFile(dataFile, JSON.stringify(commands, null, 2), 'utf8');
}

async function loadVariables() {
  try {
    const content = await readFile(variablesFile, 'utf8');

    return JSON.parse(content) as Record<string, string>;
  } catch {
    return {};
  }
}

async function saveVariables(variables: Record<string, string>) {
  await mkdir(dataDir, {recursive: true});
  await writeFile(variablesFile, JSON.stringify(variables, null, 2), 'utf8');
}

function printHelp() {
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
  a               Add command
  e               Edit selected command
  d               Delete selected command
  q or Esc        Exit

Templates:
  Use {{variableName}} in a command to fill that value before copying.

Input:
  Left/Right      Move cursor
  Ctrl+A/E        Move to start/end
  Ctrl+U          Clear input
  Ctrl+K          Delete after cursor
  Ctrl+W          Delete word before cursor
  Backspace       Delete before cursor
  Delete          Delete at cursor
`);
}

function printCommands(commands: CommandItem[]) {
  if (commands.length === 0) {
    console.log('No commands saved.');
    return;
  }

  for (const [index, item] of commands.entries()) {
    console.log(`${index + 1}. ${item.name}`);
    console.log(`   ${item.command}`);
  }
}

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
    const commands = await loadCommands();

    printCommands(commands);
    return;
  }

  render(<App />);
}

function App() {
  const {exit} = useApp();
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('list');
  const [inputValue, setInputValue] = useState('');
  const [inputCursor, setInputCursor] = useState(0);
  const inputValueRef = useRef('');
  const inputCursorRef = useRef(0);
  const [draftName, setDraftName] = useState('');
  const [message, setMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [templateCommand, setTemplateCommand] = useState('');
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const selected = commands[selectedIndex];

  useEffect(() => {
    loadCommands().then(setCommands).catch(error => {
      setMessage(error instanceof Error ? error.message : '读取命令失败');
    });

    loadVariables().then(setVariables).catch(error => {
      setMessage(error instanceof Error ? error.message : '读取变量失败');
    });
  }, []);

  useEffect(() => {
    if (commands.length === 0) {
      return;
    }

    saveCommands(commands).catch(error => {
      setMessage(error instanceof Error ? error.message : '保存命令失败');
    });
  }, [commands]);

  function setInputState(value: string, cursor: number) {
    const nextCursor = Math.max(0, Math.min(getLength(value), cursor));

    inputValueRef.current = value;
    inputCursorRef.current = nextCursor;
    setInputValue(value);
    setInputCursor(nextCursor);
  }

  function resetInput() {
    setInputState('', 0);
  }

  function resetTemplate() {
    setTemplateCommand('');
    setTemplateNames([]);
    setTemplateIndex(0);
    setTemplateValues({});
  }

  function copyCommand(command: string, nextVariables?: Record<string, string>) {
    const tasks = [clipboard.write(command)];

    if (nextVariables) {
      tasks.push(saveVariables(nextVariables));
    }

    Promise.all(tasks)
      .then(() => {
        console.log(command);
        exit();
      })
      .catch(error => {
        setMessage(error instanceof Error ? error.message : '复制失败');
      });
  }

  function startTemplateFill(command: string, names: string[]) {
    setTemplateCommand(command);
    setTemplateNames(names);
    setTemplateIndex(0);
    setTemplateValues({});
    resetInput();
    setMode('templateValue');
  }

  useInput((input, key) => {
    setMessage('');

    if (mode !== 'list') {
      if (key.escape) {
        setMode('list');
        resetInput();
        setDraftName('');
        resetTemplate();
        return;
      }

      if (isCtrl(input, key, 'u', '\u0015')) {
        resetInput();
        return;
      }

      if (isCtrl(input, key, 'a', '\u0001')) {
        setInputState(inputValueRef.current, 0);
        return;
      }

      if (isCtrl(input, key, 'e', '\u0005')) {
        setInputState(inputValueRef.current, getLength(inputValueRef.current));
        return;
      }

      if (isCtrl(input, key, 'k', '\u000b')) {
        setInputState(removeAfterCursor(inputValueRef.current, inputCursorRef.current), inputCursorRef.current);
        return;
      }

      if (isCtrl(input, key, 'w', '\u0017')) {
        const nextInput = removeWordBeforeCursor(inputValueRef.current, inputCursorRef.current);

        setInputState(nextInput.value, nextInput.cursor);
        return;
      }

      if (key.leftArrow) {
        setInputState(inputValueRef.current, inputCursorRef.current - 1);
        return;
      }

      if (key.rightArrow) {
        setInputState(inputValueRef.current, inputCursorRef.current + 1);
        return;
      }

      if (key.backspace || key.delete) {
        const currentInput = inputValueRef.current;
        const currentCursor = inputCursorRef.current;
        const nextInput = key.backspace
          ? removeBeforeCursor(currentInput, currentCursor)
          : removeAtCursor(currentInput, currentCursor);
        const nextCursor = key.backspace ? currentCursor - 1 : currentCursor;

        setInputState(nextInput, nextCursor);
        return;
      }

      if (key.return) {
        const inputText = inputValueRef.current.trim();

        if (!inputText && mode !== 'templateValue') {
          setMessage('内容不能为空');
          return;
        }

        if (mode === 'templateValue') {
          const name = templateNames[templateIndex];
          const value = inputText || variables[name] || '';

          if (!value) {
            setMessage('内容不能为空；可粘贴新值，或先保存一个默认值');
            return;
          }

          const nextValues = {...templateValues, [name]: value};
          const nextIndex = templateIndex + 1;

          if (nextIndex < templateNames.length) {
            setTemplateValues(nextValues);
            setTemplateIndex(nextIndex);
            resetInput();
            return;
          }

          const nextVariables = {...variables, ...nextValues};
          const command = renderTemplate(templateCommand, nextValues);

          setVariables(nextVariables);
          copyCommand(command, nextVariables);
          return;
        }

        if (mode === 'addName') {
          setDraftName(inputText);
          resetInput();
          setMode('addCommand');
          return;
        }

        if (mode === 'addCommand') {
          const nextCommands = [
            ...commands,
            {
              id: nanoid(),
              name: draftName,
              command: inputText
            }
          ];

          setCommands(nextCommands);
          setSelectedIndex(nextCommands.length - 1);
          setMode('list');
          resetInput();
          setDraftName('');
          setMessage('已新增命令');
          return;
        }

        if (mode === 'editName' && selected) {
          setDraftName(inputText);
          setInputState(selected.command, getLength(selected.command));
          setMode('editCommand');
          return;
        }

        if (mode === 'editCommand' && selected) {
          setCommands(items =>
            items.map((item, index) =>
              index === selectedIndex
                ? {
                    ...item,
                    name: draftName,
                    command: inputText
                  }
                : item
            )
          );
          setMode('list');
          resetInput();
          setDraftName('');
          setMessage('已更新命令');
          return;
        }
      }

      if (input) {
        const nextInput = insertAtCursor(inputValueRef.current, inputCursorRef.current, input);

        setInputState(nextInput, inputCursorRef.current + getLength(input));
      }

      return;
    }

    if (key.escape || input === 'q') {
      exit();
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex(index => Math.max(0, index - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex(index => Math.min(commands.length - 1, index + 1));
      return;
    }

    if (input === 'a') {
      resetInput();
      setDraftName('');
      setMode('addName');
      return;
    }

    if (input === 'e' && selected) {
      setInputState(selected.name, getLength(selected.name));
      setDraftName('');
      setMode('editName');
      return;
    }

    if (input === 'd' && selected) {
      const nextCommands = commands.filter((_, index) => index !== selectedIndex);

      setCommands(nextCommands);
      setSelectedIndex(index => Math.max(0, Math.min(index, nextCommands.length - 1)));
      setMessage('已删除命令');
      return;
    }

    if (key.return && selected) {
      const names = extractTemplateNames(selected.command);

      if (names.length > 0) {
        startTemplateFill(selected.command, names);
        return;
      }

      copyCommand(selected.command);
    }
  });

  if (mode !== 'list') {
    const currentTemplateName = templateNames[templateIndex] ?? '';
    const currentDefaultValue = variables[currentTemplateName] ?? '';
    const label =
      mode === 'templateValue'
        ? `输入变量 ${currentTemplateName}`
        : getInputLabel(mode);

    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          {label}
        </Text>
        <Text>
          {'> '}
          {renderInputValue(inputValue, inputCursor)}
        </Text>
        <Text color="gray">Left/Right 移动光标，Ctrl+U 清空，Enter 确认，Esc 取消</Text>
        {mode === 'templateValue' ? (
          <Box flexDirection="column">
            {currentDefaultValue ? (
              <Text color="gray">默认值: {currentDefaultValue}（直接 Enter 使用）</Text>
            ) : null}
            <Text color="gray">
              {templateIndex + 1}/{templateNames.length} {templateCommand}
            </Text>
          </Box>
        ) : null}
        {message ? <Text color="yellow">{message}</Text> : null}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Command Helper
      </Text>

      <Box marginTop={1} flexDirection="column">
        {commands.length === 0 ? (
          <Text color="gray">暂无命令，按 a 新增</Text>
        ) : (
          commands.map((item, index) => {
            const active = index === selectedIndex;

            return (
              <Box key={item.id} flexDirection="column">
                <Text color={active ? 'green' : undefined}>
                  {active ? '> ' : '  '}
                  {item.name}
                </Text>
                {active ? <Text color="gray">  {item.command}</Text> : null}
              </Box>
            );
          })
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color="gray">Up/Down 或 j/k 选择，Enter 复制并退出</Text>
        <Text color="gray">a 新增，e 编辑，d 删除，q/Esc 退出</Text>
        {message ? <Text color="yellow">{message}</Text> : null}
      </Box>
    </Box>
  );
}

function getInputLabel(mode: Mode) {
  if (mode === 'addName') {
    return '输入命令名称';
  }

  if (mode === 'addCommand') {
    return '输入命令内容';
  }

  if (mode === 'editName') {
    return '编辑命令名称';
  }

  return '编辑命令内容';
}

function getChars(value: string) {
  return Array.from(value);
}

function getLength(value: string) {
  return getChars(value).length;
}

function insertAtCursor(value: string, cursor: number, input: string) {
  const chars = getChars(value);

  chars.splice(cursor, 0, ...getChars(input));

  return chars.join('');
}

function removeBeforeCursor(value: string, cursor: number) {
  if (cursor === 0) {
    return value;
  }

  const chars = getChars(value);

  chars.splice(cursor - 1, 1);

  return chars.join('');
}

function removeAtCursor(value: string, cursor: number) {
  const chars = getChars(value);

  if (cursor >= chars.length) {
    return value;
  }

  chars.splice(cursor, 1);

  return chars.join('');
}

function removeAfterCursor(value: string, cursor: number) {
  return getChars(value).slice(0, cursor).join('');
}

function removeWordBeforeCursor(value: string, cursor: number) {
  const chars = getChars(value);
  let start = cursor;

  while (start > 0 && chars[start - 1] === ' ') {
    start--;
  }

  while (start > 0 && chars[start - 1] !== ' ') {
    start--;
  }

  chars.splice(start, cursor - start);

  return {
    value: chars.join(''),
    cursor: start
  };
}

function isCtrl(input: string, key: {ctrl?: boolean}, letter: string, sequence: string) {
  return (key.ctrl === true && input === letter) || input === sequence;
}

function extractTemplateNames(command: string) {
  const names = new Set<string>();
  const pattern = /{{\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*}}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(command)) !== null) {
    names.add(match[1]);
  }

  return [...names];
}

function renderTemplate(command: string, values: Record<string, string>) {
  return command.replace(/{{\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*}}/g, (_, name: string) => {
    return values[name] ?? '';
  });
}

function renderInputValue(value: string, cursor: number) {
  const chars = getChars(value);
  const before = chars.slice(0, cursor).join('');
  const current = chars[cursor] ?? ' ';
  const after = chars.slice(cursor + 1).join('');

  return (
    <>
      {before}
      <Text inverse>{current}</Text>
      {after}
    </>
  );
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
