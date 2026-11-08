export interface NamedField {
  name: string;
  value: string;
}

/**
 * Parse a Slack mrkdwn/plain field text (`*Name*\nvalue` or `Name\nvalue`).
 */
export function parseFieldText(text: string): NamedField | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const match = trimmed.match(/^\*?([^*\n]+)\*?\n([\s\S]*)$/);
  if (match === null) {
    return null;
  }

  const name = match[1].trim();
  const value = match[2].trim();
  if (name.length === 0) {
    return null;
  }

  return { name, value };
}

/**
 * Overlay incoming fields onto existing ones by exact field name.
 * Existing order is preserved; new names are appended.
 */
export function mergeNamedFields(
  existing: NamedField[],
  incoming: NamedField[],
): NamedField[] {
  const result = existing.map((field) => ({ ...field }));

  for (const field of incoming) {
    const index = result.findIndex((item) => item.name === field.name);
    if (index >= 0) {
      result[index] = { ...field };
    } else {
      result.push({ ...field });
    }
  }

  return result;
}

/**
 * Convert named fields back to Action `name: value` field lines.
 */
export function toFieldLines(fields: NamedField[]): string[] {
  return fields.map((field) => `${field.name}: ${field.value}`);
}
