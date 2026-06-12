import type {Mode} from './appTypes.js';

export function getInputLabel(mode: Mode, categoryName: string) {
  if (mode === 'addName') {
    return `在 ${categoryName} 新增命令名称`;
  }

  if (mode === 'addCommand') {
    return `在 ${categoryName} 新增命令内容`;
  }

  if (mode === 'addAction') {
    return `选择 ${categoryName} 新命令行为`;
  }

  if (mode === 'editName') {
    return `编辑 ${categoryName} 命令名称`;
  }

  if (mode === 'editAction') {
    return `选择 ${categoryName} 命令行为`;
  }

  return `编辑 ${categoryName} 命令内容`;
}
