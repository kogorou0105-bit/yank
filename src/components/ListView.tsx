import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import {formatCommandAction} from '../commands.js';
import type {Mode} from '../appTypes.js';
import type {CommandCategory, CommandItem} from '../types.js';

type ListViewProps = {
  categories: CommandCategory[];
  currentCategoryIndex: number;
  inputValue: string;
  message: string;
  mode: Mode;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  selectedIndex: number;
  visibleCommands: CommandItem[];
};

export function ListView({
  categories,
  currentCategoryIndex,
  inputValue,
  message,
  mode,
  onSearchChange,
  onSearchSubmit,
  selectedIndex,
  visibleCommands
}: ListViewProps) {
  const currentCategory = categories[currentCategoryIndex];
  const currentCategoryName = currentCategory?.name ?? 'Home';

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {currentCategoryName}
      </Text>

      <Box marginTop={1}>
        {categories.map((category, index) => {
          const active = index === currentCategoryIndex;

          return (
            <Text key={category.id} color={active ? 'green' : 'gray'}>
              {active ? `[${category.name}]` : category.name}
              {index < categories.length - 1 ? '  ' : ''}
            </Text>
          );
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        {(currentCategory?.commands.length ?? 0) === 0 ? (
          <Text color="gray">当前分类暂无命令，按 a 新增</Text>
        ) : visibleCommands.length === 0 ? (
          <Text color="gray">当前分类没有匹配的命令</Text>
        ) : (
          visibleCommands.map((item, index) => {
            const active = index === selectedIndex;

            return (
              <Box key={item.id} flexDirection="column">
                <Text color={active ? 'green' : undefined}>
                  {active ? '> ' : '  '}
                  {formatCommandAction(item)} {' '}
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
        <Text color="gray">Left/Right 切换分类，Up/Down 或 j/k 选择，Enter 复制或执行</Text>
        {mode === 'search' ? (
          <Text color="gray">输入关键字过滤当前分类，Esc 清空搜索</Text>
        ) : (
          <Text color="gray">/ 搜索，a 新增，e 编辑，d 删除，t 切换复制/执行，q/Esc 退出</Text>
        )}
        {message ? <Text color="yellow">{message}</Text> : null}
      </Box>
    </Box>
  );
}
