import {useInput} from 'ink';
import type {Mode} from '../appTypes.js';
import type {CommandAction, CommandItem} from '../types.js';
import type {Dispatch, SetStateAction} from 'react';

type UseKeyboardControlsOptions = {
  cancelInput: () => void;
  confirmDelete: () => void;
  exit: () => void;
  mode: Mode;
  resetDraft: () => void;
  resetInput: () => void;
  selected: CommandItem | undefined;
  setDeleteCandidate: Dispatch<SetStateAction<CommandItem | null>>;
  setDraftAction: Dispatch<SetStateAction<CommandAction>>;
  setDraftCommand: Dispatch<SetStateAction<string>>;
  setDraftName: Dispatch<SetStateAction<string>>;
  setEditCandidate: Dispatch<SetStateAction<CommandItem | null>>;
  setInputValue: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setMode: Dispatch<SetStateAction<Mode>>;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  submitDraftAction: () => void;
  submitSelectedCommand: (command: CommandItem) => void;
  switchCategory: (offset: number) => void;
  toggleDraftAction: () => void;
  toggleSelectedAction: (command: CommandItem) => void;
  visibleCommandsLength: number;
};

export function useKeyboardControls({
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
  visibleCommandsLength
}: UseKeyboardControlsOptions) {
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

    if (key.leftArrow || key.rightArrow || input === 't') {
      toggleDraftAction();
      return;
    }

    if (input === 'c' || input === 'C') {
      setDraftAction('copy');
      return;
    }

    if (input === 'r' || input === 'R') {
      setDraftAction('run');
      return;
    }

    if (key.return) {
      submitDraftAction();
    }
  }, {isActive: mode === 'addAction' || mode === 'editAction'});

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
        setSelectedIndex(index => Math.max(0, Math.min(visibleCommandsLength - 1, index + 1)));
      }

      return;
    }

    if (key.escape || input === 'q') {
      exit();
      return;
    }

    if (key.leftArrow) {
      switchCategory(-1);
      return;
    }

    if (key.rightArrow) {
      switchCategory(1);
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex(index => Math.max(0, index - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex(index => Math.max(0, Math.min(visibleCommandsLength - 1, index + 1)));
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
      resetDraft();
      setMode('addName');
      return;
    }

    if (input === 'e' && selected) {
      setInputValue(selected.name);
      setDraftName('');
      setDraftCommand('');
      setDraftAction(selected.action ?? 'copy');
      setEditCandidate(selected);
      setMode('editName');
      return;
    }

    if (input === 'd' && selected) {
      setDeleteCandidate(selected);
      setMode('deleteConfirm');
      return;
    }

    if (input === 't' && selected) {
      toggleSelectedAction(selected);
      return;
    }

    if (key.return && selected) {
      submitSelectedCommand(selected);
    }
  }, {isActive: mode === 'list' || mode === 'search'});
}
