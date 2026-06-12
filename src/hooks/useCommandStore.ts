import {useEffect, useState} from 'react';
import {loadCommandStore, saveCommandStore} from '../storage.js';
import type {CommandCategory} from '../types.js';
import type {Dispatch, SetStateAction} from 'react';

type UseCommandStoreOptions = {
  setMessage: Dispatch<SetStateAction<string>>;
};

export function useCommandStore({setMessage}: UseCommandStoreOptions) {
  const [categories, setCategories] = useState<CommandCategory[]>([]);
  const [commandsLoaded, setCommandsLoaded] = useState(false);

  useEffect(() => {
    loadCommandStore()
      .then(store => {
        setCategories(store.categories);
        setCommandsLoaded(true);
      })
      .catch(error => {
        setCommandsLoaded(true);
        setMessage(error instanceof Error ? error.message : '读取命令失败');
      });
  }, [setMessage]);

  useEffect(() => {
    if (!commandsLoaded) {
      return;
    }

    saveCommandStore({version: 2, categories}).catch(error => {
      setMessage(error instanceof Error ? error.message : '保存命令失败');
    });
  }, [categories, commandsLoaded, setMessage]);

  return {categories, setCategories};
}
