import type { MessageMetadata } from '@slack/types';

export interface NamedField {
  name: string;
  value: string;
}

export interface MergeFence {
  rev: number;
  writer: string;
}

export const MERGE_METADATA_EVENT_TYPE = 'slack_action_merge';

/** Legacy visible fence field names (stripped from attachments on merge). */
const LEGACY_MERGE_REV_FIELD = '_merge_rev';
const LEGACY_MERGE_WRITER_FIELD = '_merge_writer';

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

export function isLegacyMergeFenceField(name: string): boolean {
  return name === LEGACY_MERGE_REV_FIELD || name === LEGACY_MERGE_WRITER_FIELD;
}

/**
 * Drop legacy visible `_merge_*` attachment fields from older messages.
 */
export function stripLegacyMergeFenceFields(
  fields: NamedField[],
): NamedField[] {
  return fields.filter((field) => !isLegacyMergeFenceField(field.name));
}

export function emptyMergeFence(): MergeFence {
  return { rev: 0, writer: '' };
}

/**
 * Loose metadata shape from conversations.history responses.
 */
export type SlackMessageMetadata = {
  event_type?: string;
  event_payload?: Record<string, unknown>;
};

/**
 * Parse OCC fence from Slack message metadata. Missing/invalid ⇒ rev 0.
 */
export function parseMergeFence(
  metadata: SlackMessageMetadata | MessageMetadata | undefined,
): MergeFence {
  if (
    metadata === undefined ||
    metadata.event_type !== MERGE_METADATA_EVENT_TYPE ||
    metadata.event_payload === undefined
  ) {
    return emptyMergeFence();
  }

  const { merge_rev: rawRev, merge_writer: rawWriter } =
    metadata.event_payload as {
      merge_rev?: unknown;
      merge_writer?: unknown;
    };
  let rev = 0;
  if (typeof rawRev === 'number' && Number.isFinite(rawRev) && rawRev >= 0) {
    rev = Math.floor(rawRev);
  } else if (typeof rawRev === 'string') {
    const parsed = Number.parseInt(rawRev, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      rev = parsed;
    }
  }

  const writer = typeof rawWriter === 'string' ? rawWriter : '';
  return { rev, writer };
}

/**
 * Build Slack message metadata carrying the OCC fence.
 */
export function buildMergeMetadata(fence: MergeFence): MessageMetadata {
  return {
    event_type: MERGE_METADATA_EVENT_TYPE,
    event_payload: {
      merge_rev: fence.rev,
      merge_writer: fence.writer,
    },
  };
}

/**
 * Overlay incoming fields onto existing ones by exact field name.
 * Existing order is preserved; new names are appended.
 * Legacy `_merge_*` names in `incoming` are ignored.
 */
export function mergeNamedFields(
  existing: NamedField[],
  incoming: NamedField[],
): NamedField[] {
  const result = stripLegacyMergeFenceFields(existing).map((field) => ({
    ...field,
  }));

  for (const field of incoming) {
    if (isLegacyMergeFenceField(field.name)) {
      continue;
    }

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

function toNamedFieldMap(fields: NamedField[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const field of fields) {
    map.set(field.name, field.value);
  }
  return map;
}

/**
 * True when both lists define the same name→value map (order ignored).
 */
export function namedFieldsEqual(a: NamedField[], b: NamedField[]): boolean {
  const left = toNamedFieldMap(a);
  const right = toNamedFieldMap(b);
  if (left.size !== right.size) {
    return false;
  }

  for (const [name, value] of left) {
    if (right.get(name) !== value) {
      return false;
    }
  }

  return true;
}

/**
 * True when every consumer incoming field name is present on `live` with the
 * same value. Legacy fence names in `incoming` are ignored.
 */
export function incomingFieldsConfirmed(
  live: NamedField[],
  incoming: NamedField[],
): boolean {
  for (const field of incoming) {
    if (isLegacyMergeFenceField(field.name)) {
      continue;
    }

    const found = live.find((item) => item.name === field.name);
    if (found === undefined || found.value !== field.value) {
      return false;
    }
  }
  return true;
}

/**
 * True when this attempt's fence is on live and consumer incoming fields match.
 */
export function mergeAttemptSucceeded(
  liveFence: MergeFence,
  expectedRev: number,
  writerId: string,
  liveFields: NamedField[],
  incoming: NamedField[],
): boolean {
  return (
    liveFence.rev === expectedRev &&
    liveFence.writer === writerId &&
    incomingFieldsConfirmed(liveFields, incoming)
  );
}
