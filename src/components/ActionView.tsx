import {Box, Text} from 'ink';
import {formatCommandAction} from '../commands.js';
import type {Mode} from '../appTypes.js';
import type {CommandAction} from '../types.js';

type ActionViewProps = {
  action: CommandAction;
  categoryName: string;
  command: string;
  message: string;
  mode: Extract<Mode, 'addAction' | 'editAction'>;
  name: string;
};

export function ActionView({action, categoryName, command, message, mode, name}: ActionViewProps) {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {mode === 'addAction' ? `选择 ${categoryName} 新命令行为` : `选择 ${categoryName} 命令行为`}
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text>{name}</Text>
        <Text color="gray">{command}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={action === 'copy' ? 'green' : 'gray'}>{formatCommandAction('copy')}</Text>
        <Text>  </Text>
        <Text color={action === 'run' ? 'green' : 'gray'}>{formatCommandAction('run')}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">Left/Right 或 t 切换，c/r 选择，Enter 保存，Esc 取消</Text>
        {message ? <Text color="yellow">{message}</Text> : null}
      </Box>
    </Box>
  );
}
