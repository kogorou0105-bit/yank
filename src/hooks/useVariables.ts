import {useEffect, useState} from 'react';
import {loadVariables} from '../storage.js';
import type {Variables} from '../types.js';
import type {Dispatch, SetStateAction} from 'react';

type UseVariablesOptions = {
  setMessage: Dispatch<SetStateAction<string>>;
};

export function useVariables({setMessage}: UseVariablesOptions) {
  const [variables, setVariables] = useState<Variables>({});

  useEffect(() => {
    loadVariables().then(setVariables).catch(error => {
      setMessage(error instanceof Error ? error.message : '读取变量失败');
    });
  }, [setMessage]);

  return {variables, setVariables};
}
