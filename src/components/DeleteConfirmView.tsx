import {Box, Text} from 'ink';
import type {CommandItem} from '../types.js';

type DeleteConfirmViewProps = {
  command: CommandItem | null;
  message: string;
};

export function DeleteConfirmView({command, message}: DeleteConfirmViewProps) {
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
