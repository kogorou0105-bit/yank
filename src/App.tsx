import React, {useEffect, useState} from 'react';
import clipboard from 'clipboardy';
import {Box, Text, useApp, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {nanoid} from 'nanoid';
import {filterCommands} from './commands.js';
import {loadCommands, loadVariables, saveCommands, saveVariables} from './storage.js';
import {extractTemplateNames, renderTemplate} from './templates.js';
import type {CommandItem, Variables} from './types.js';

type Mode =
  | 'list'
  | 'search'
  | 'addName'
  | 'addCommand'
  | 'editName'
  | 'editCommand'
  | 'templateValue'
  | 'deleteConfirm';

export function App() {
  const {exit} = useApp();
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [commandsLoaded, setCommandsLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('list');
  const [inputValue, setInputValue] = useState('');
  const [draftName, setDraftName] = useState('');
  const [message, setMessage] = useState('');
  const [variables, setVariables] = useState<Variables>({});
  const [templateCommand, setTemplateCommand] = useState('');
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [templateValues, setTemplateValues] = useState<Variables>({});
  const [deleteCandidate, setDeleteCandidate] = useState<CommandItem | null>(null);
  const visibleCommands = mode === 'search' ? filterCommands(commands, inputValue) : commands;
  const selected = visibleCommands[selectedIndex];

  useEffect(() => {
    loadCommands()
      .then(commands => {
        setCommands(commands);
        setCommandsLoaded(true);
      })
      .catch(error => {
        setCommandsLoaded(true);
        setMessage(error instanceof Error ? error.message : '读取命令失败');
      });

    loadVariables().then(setVariables).catch(error => {
      setMessage(error instanceof Error ? error.message : '读取变量失败');
    });
  }, []);

  useEffect(() => {
    if (!commandsLoaded) {
      return;
    }

    saveCommands(commands).catch(error => {
      setMessage(error instanceof Error ? error.message : '保存命令失败');
    });
  }, [commands, commandsLoaded]);

  function resetInput() {
    setInputValue('');
  }

  function resetTemplate() {
    setTemplateCommand('');
    setTemplateNames([]);
    setTemplateIndex(0);
    setTemplateValues({});
  }

  function resetDeleteCandidate() {
    setDeleteCandidate(null);
  }

  function copyCommand(command: string, nextVariables?: Variables) {
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

  function copySelectedCommand(command: CommandItem) {
    const names = extractTemplateNames(command.command);

    if (names.length > 0) {
      startTemplateFill(command.command, names);
      return;
    }

    copyCommand(command.command);
  }

  function cancelInput() {
    setMode('list');
    resetInput();
    setDraftName('');
    resetTemplate();
    resetDeleteCandidate();
  }

  function confirmDelete() {
    if (!deleteCandidate) {
      cancelInput();
      return;
    }

    const nextCommands = commands.filter(item => item.id !== deleteCandidate.id);

    setCommands(nextCommands);
    setSelectedIndex(index => Math.max(0, Math.min(index, nextCommands.length - 1)));
    setMode('list');
    resetDeleteCandidate();
    setMessage('已删除命令');
  }

  function submitInput(value: string) {
    const inputText = value.trim();

    if (!inputText && mode !== 'templateValue') {
      setMessage('内容不能为空');
      return;
    }

    if (mode === 'templateValue') {
      submitTemplateValue(inputText);
      return;
    }

    if (mode === 'addName') {
      setDraftName(inputText);
      resetInput();
      setMode('addCommand');
      return;
    }

    if (mode === 'addCommand') {
      addCommand(inputText);
      return;
    }

    if (mode === 'editName' && selected) {
      setDraftName(inputText);
      setInputValue(selected.command);
      setMode('editCommand');
      return;
    }

    if (mode === 'editCommand' && selected) {
      updateCommand(inputText);
    }
  }

  function submitTemplateValue(inputText: string) {
    const name = templateNames[templateIndex];
    const nextValue = inputText || variables[name] || '';

    if (!nextValue) {
      setMessage('内容不能为空；可粘贴新值，或先保存一个默认值');
      return;
    }

    const nextValues = {...templateValues, [name]: nextValue};
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
  }

  function addCommand(command: string) {
    const nextCommands = [
      ...commands,
      {
        id: nanoid(),
        name: draftName,
        command
      }
    ];

    setCommands(nextCommands);
    setSelectedIndex(nextCommands.length - 1);
    setMode('list');
    resetInput();
    setDraftName('');
    setMessage('已新增命令');
  }

  function updateCommand(command: string) {
    setCommands(items =>
      items.map(item =>
        item.id === selected.id
          ? {
              ...item,
              name: draftName,
              command
            }
          : item
      )
    );
    setMode('list');
    resetInput();
    setDraftName('');
    setMessage('已更新命令');
  }

  useInput((_, key) => {
    setMessage('');

    if (mode === 'deleteConfirm') {
      return;
    }

    if (key.escape) {
      cancelInput();
    }
  }, {isActive: mode !== 'list' && mode !== 'search'});

  useInput((input, key) => {
    setMessage('');

    if (key.escape || input === 'n' || input === 'N') {
      cancelInput();
      return;
    }

    if (input === 'y' || input === 'Y') {
      confirmDelete();
    }
  }, {isActive: mode === 'deleteConfirm'});

  useInput((input, key) => {
    setMessage('');

    if (mode === 'search') {
      if (key.escape) {
        setMode('list');
        resetInput();
        setSelectedIndex(0);
        return;
      }

      if (key.upArrow) {
        setSelectedIndex(index => Math.max(0, index - 1));
        return;
      }

      if (key.downArrow) {
        setSelectedIndex(index => Math.max(0, Math.min(visibleCommands.length - 1, index + 1)));
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
      setSelectedIndex(index => Math.max(0, Math.min(visibleCommands.length - 1, index + 1)));
      return;
    }

    if (input === '/') {
      resetInput();
      setSelectedIndex(0);
      setMode('search');
      return;
    }

    if (input === 'a') {
      resetInput();
      setDraftName('');
      setMode('addName');
      return;
    }

    if (input === 'e' && selected) {
      setInputValue(selected.name);
      setDraftName('');
      setMode('editName');
      return;
    }

    if (input === 'd' && selected) {
      setDeleteCandidate(selected);
      setMode('deleteConfirm');
      return;
    }

    if (key.return && selected) {
      copySelectedCommand(selected);
    }
  }, {isActive: mode === 'list' || mode === 'search'});

  if (mode === 'deleteConfirm') {
    return <DeleteConfirmView command={deleteCandidate} message={message} />;
  }

  if (mode !== 'list' && mode !== 'search') {
    return (
      <InputView
        currentDefaultValue={variables[templateNames[templateIndex] ?? ''] ?? ''}
        inputValue={inputValue}
        label={mode === 'templateValue' ? `输入变量 ${templateNames[templateIndex] ?? ''}` : getInputLabel(mode)}
        message={message}
        mode={mode}
        onChange={setInputValue}
        onSubmit={submitInput}
        templateCommand={templateCommand}
        templateIndex={templateIndex}
        templateNames={templateNames}
      />
    );
  }

  return (
    <ListView
      commands={commands}
      inputValue={inputValue}
      message={message}
      mode={mode}
      onSearchChange={value => {
        setInputValue(value);
        setSelectedIndex(0);
      }}
      onSearchSubmit={() => {
        if (selected) {
          copySelectedCommand(selected);
        }
      }}
      selectedIndex={selectedIndex}
      visibleCommands={visibleCommands}
    />
  );
}

function InputView({
  currentDefaultValue,
  inputValue,
  label,
  message,
  mode,
  onChange,
  onSubmit,
  templateCommand,
  templateIndex,
  templateNames
}: {
  currentDefaultValue: string;
  inputValue: string;
  label: string;
  message: string;
  mode: Mode;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  templateCommand: string;
  templateIndex: number;
  templateNames: string[];
}) {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {label}
      </Text>
      <Box>
        <Text>{'> '}</Text>
        <TextInput value={inputValue} onChange={onChange} onSubmit={onSubmit} />
      </Box>
      <Text color="gray">使用系统输入框行为：移动光标、长按删除、粘贴都按终端默认方式处理</Text>
      <Text color="gray">Enter 确认，Esc 取消</Text>
      {mode === 'templateValue' ? (
        <Box flexDirection="column">
          {currentDefaultValue ? <Text color="gray">默认值: {currentDefaultValue}（直接 Enter 使用）</Text> : null}
          <Text color="gray">
            {templateIndex + 1}/{templateNames.length} {templateCommand}
          </Text>
        </Box>
      ) : null}
      {message ? <Text color="yellow">{message}</Text> : null}
    </Box>
  );
}

function DeleteConfirmView({command, message}: {command: CommandItem | null; message: string}) {
  return (
    <Box flexDirection="column">
      <Text bold color="red">
        确认删除这个命令？
      </Text>
      {command ? (
        <Box marginTop={1} flexDirection="column">
          <Text>{command.name}</Text>
          <Text color="gray">{command.command}</Text>
        </Box>
      ) : null}
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">y 确认删除，n/Esc 取消</Text>
        {message ? <Text color="yellow">{message}</Text> : null}
      </Box>
    </Box>
  );
}

function ListView({
  commands,
  inputValue,
  message,
  mode,
  onSearchChange,
  onSearchSubmit,
  selectedIndex,
  visibleCommands
}: {
  commands: CommandItem[];
  inputValue: string;
  message: string;
  mode: Mode;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  selectedIndex: number;
  visibleCommands: CommandItem[];
}) {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Command Helper
      </Text>

      <Box marginTop={1} flexDirection="column">
        {commands.length === 0 ? (
          <Text color="gray">暂无命令，按 a 新增</Text>
        ) : visibleCommands.length === 0 ? (
          <Text color="gray">没有匹配的命令</Text>
        ) : (
          visibleCommands.map((item, index) => {
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
        {mode === 'search' ? (
          <Box>
            <Text color="cyan">Search: </Text>
            <TextInput value={inputValue} onChange={onSearchChange} onSubmit={onSearchSubmit} />
          </Box>
        ) : null}
        <Text color="gray">Up/Down 或 j/k 选择，Enter 复制并退出</Text>
        {mode === 'search' ? (
          <Text color="gray">输入关键字过滤，Esc 清空搜索</Text>
        ) : (
          <Text color="gray">/ 搜索，a 新增，e 编辑，d 删除，q/Esc 退出</Text>
        )}
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
