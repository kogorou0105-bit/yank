import {useEffect, useState} from 'react';
import clipboard from 'clipboardy';
import {useApp} from 'ink';
import {nanoid} from 'nanoid';
import {filterCommands, getCommandAction} from '../commands.js';
import {getInputLabel} from '../inputLabels.js';
import {saveVariables} from '../storage.js';
import {extractTemplateNames, renderTemplate} from '../templates.js';
import {useCommandStore} from './useCommandStore.js';
import {useKeyboardControls} from './useKeyboardControls.js';
import {useVariables} from './useVariables.js';
import type {AppProps, Mode} from '../appTypes.js';
import type {CommandAction, CommandItem, Variables} from '../types.js';

export function useCommandController({onRunCommand}: AppProps) {
  const {exit} = useApp();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('list');
  const [inputValue, setInputValue] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftCommand, setDraftCommand] = useState('');
  const [draftAction, setDraftAction] = useState<CommandAction>('copy');
  const [message, setMessage] = useState('');
  const {categories, setCategories} = useCommandStore({setMessage});
  const {variables, setVariables} = useVariables({setMessage});
  const [templateCommand, setTemplateCommand] = useState('');
  const [templateAction, setTemplateAction] = useState<CommandAction>('copy');
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [templateValues, setTemplateValues] = useState<Variables>({});
  const [deleteCandidate, setDeleteCandidate] = useState<CommandItem | null>(null);
  const [editCandidate, setEditCandidate] = useState<CommandItem | null>(null);
  const currentCategory = categories[currentCategoryIndex];
  const currentCategoryName = currentCategory?.name ?? 'Home';
  const currentCommands = currentCategory?.commands ?? [];
  const visibleCommands = mode === 'search' ? filterCommands(currentCommands, inputValue) : currentCommands;
  const selected = visibleCommands[selectedIndex];
  const currentDefaultValue = variables[templateNames[templateIndex] ?? ''] ?? '';
  const inputLabel = mode === 'templateValue' ? `输入变量 ${templateNames[templateIndex] ?? ''}` : getInputLabel(mode, currentCategoryName);

  useEffect(() => {
    setCurrentCategoryIndex(index => Math.max(0, Math.min(index, categories.length - 1)));
  }, [categories.length]);

  function resetInput() {
    setInputValue('');
  }

  function resetTemplate() {
    setTemplateCommand('');
    setTemplateAction('copy');
    setTemplateNames([]);
    setTemplateIndex(0);
    setTemplateValues({});
  }

  function resetDeleteCandidate() {
    setDeleteCandidate(null);
  }

  function resetDraft() {
    setDraftName('');
    setDraftCommand('');
    setDraftAction('copy');
    setEditCandidate(null);
  }

  function updateCurrentCommands(nextCommands: CommandItem[]) {
    setCategories(items =>
      items.map((category, index) => (index === currentCategoryIndex ? {...category, commands: nextCommands} : category))
    );
  }

  function switchCategory(offset: number) {
    if (categories.length === 0) {
      return;
    }

    setCurrentCategoryIndex(index => (index + offset + categories.length) % categories.length);
    setSelectedIndex(0);
    resetInput();
    resetTemplate();
    resetDeleteCandidate();
    resetDraft();
    setMode('list');
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

  function startTemplateFill(command: string, action: CommandAction, names: string[]) {
    setTemplateCommand(command);
    setTemplateAction(action);
    setTemplateNames(names);
    setTemplateIndex(0);
    setTemplateValues({});
    resetInput();
    setMode('templateValue');
  }

  function submitSelectedCommand(command: CommandItem) {
    const action = getCommandAction(command);
    const names = extractTemplateNames(command.command);

    if (names.length > 0) {
      startTemplateFill(command.command, action, names);
      return;
    }

    completeCommand(command.command, action);
  }

  function completeCommand(command: string, action: CommandAction, nextVariables?: Variables) {
    if (action === 'run') {
      runCommand(command, nextVariables);
      return;
    }

    copyCommand(command, nextVariables);
  }

  function runCommand(command: string, nextVariables?: Variables) {
    const tasks = nextVariables ? [saveVariables(nextVariables)] : [];

    Promise.all(tasks)
      .then(() => {
        onRunCommand?.(command);
        exit();
      })
      .catch(error => {
        setMessage(error instanceof Error ? error.message : '执行失败');
      });
  }

  function cancelInput() {
    setMode('list');
    resetInput();
    resetDraft();
    resetTemplate();
    resetDeleteCandidate();
  }

  function confirmDelete() {
    if (!deleteCandidate) {
      cancelInput();
      return;
    }

    const nextCommands = currentCommands.filter(item => item.id !== deleteCandidate.id);

    updateCurrentCommands(nextCommands);
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
      setDraftCommand(inputText);
      setDraftAction('copy');
      resetInput();
      setMode('addAction');
      return;
    }

    if (mode === 'editName' && editCandidate) {
      setDraftName(inputText);
      setInputValue(editCandidate.command);
      setMode('editCommand');
      return;
    }

    if (mode === 'editCommand' && editCandidate) {
      setDraftCommand(inputText);
      setDraftAction(getCommandAction(editCandidate));
      resetInput();
      setMode('editAction');
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
    completeCommand(command, templateAction, nextVariables);
  }

  function addCommand(command: string, action: CommandAction) {
    const nextCommands = [
      ...currentCommands,
      {
        id: nanoid(),
        name: draftName,
        command,
        action
      }
    ];

    updateCurrentCommands(nextCommands);
    setSelectedIndex(nextCommands.length - 1);
    setMode('list');
    resetInput();
    resetDraft();
    setMessage('已新增命令');
  }

  function updateCommand(command: string, action: CommandAction) {
    if (!editCandidate) {
      cancelInput();
      return;
    }

    const nextCommands = currentCommands.map(item =>
      item.id === editCandidate.id
        ? {
            ...item,
            name: draftName,
            command,
            action
          }
        : item
    );
    const nextIndex = nextCommands.findIndex(item => item.id === editCandidate.id);

    updateCurrentCommands(nextCommands);
    setSelectedIndex(Math.max(0, nextIndex));
    setMode('list');
    resetInput();
    resetDraft();
    setMessage('已更新命令');
  }

  function toggleDraftAction() {
    setDraftAction(action => (action === 'copy' ? 'run' : 'copy'));
  }

  function submitDraftAction() {
    if (mode === 'addAction') {
      addCommand(draftCommand, draftAction);
      return;
    }

    if (mode === 'editAction') {
      updateCommand(draftCommand, draftAction);
    }
  }

  function toggleSelectedAction(command: CommandItem) {
    const nextAction: CommandAction = getCommandAction(command) === 'copy' ? 'run' : 'copy';

    updateCurrentCommands(
      currentCommands.map(item =>
        item.id === command.id
          ? {
              ...item,
              action: nextAction
            }
          : item
      )
    );
    setMessage(nextAction === 'run' ? '已切换为执行模式' : '已切换为复制模式');
  }

  function onSearchChange(value: string) {
    setInputValue(value);
    setSelectedIndex(0);
  }

  function onSearchSubmit() {
    if (selected) {
      submitSelectedCommand(selected);
    }
  }

  useKeyboardControls({
    cancelInput,
    confirmDelete,
    exit,
    mode,
    resetDraft,
    resetInput,
    selected,
    setDeleteCandidate,
    setDraftAction,
    setDraftCommand,
    setDraftName,
    setEditCandidate,
    setInputValue,
    setMessage,
    setMode,
    setSelectedIndex,
    submitDraftAction,
    submitSelectedCommand,
    switchCategory,
    toggleDraftAction,
    toggleSelectedAction,
    visibleCommandsLength: visibleCommands.length
  });

  return {
    categories,
    currentCategoryIndex,
    currentCategoryName,
    currentDefaultValue,
    deleteCandidate,
    draftAction,
    draftCommand,
    draftName,
    inputLabel,
    inputValue,
    message,
    mode,
    onInputChange: setInputValue,
    onInputSubmit: submitInput,
    onSearchChange,
    onSearchSubmit,
    selectedIndex,
    templateCommand,
    templateIndex,
    templateNames,
    visibleCommands
  };
}
