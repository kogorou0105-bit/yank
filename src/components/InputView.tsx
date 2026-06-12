import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import type {Mode} from '../appTypes.js';

type InputViewProps = {
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
};

export function InputView({
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
}: InputViewProps) {
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
