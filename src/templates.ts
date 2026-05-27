export function extractTemplateNames(command: string) {
  const names = new Set<string>();
  const pattern = /{{\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*}}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(command)) !== null) {
    names.add(match[1]);
  }

  return [...names];
}

export function renderTemplate(command: string, values: Record<string, string>) {
  return command.replace(/{{\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*}}/g, (_, name: string) => {
    return values[name] ?? '';
  });
}
