import { MrkdwnElement, PlainTextElement } from '@slack/bolt';
import { Status } from '../../status';

export type FieldType = 'mrkdwn' | 'plain_text';

export interface FieldOptions {
  name?: string;
  status?: Status;
  type?: FieldType;
  value: string;
}

export interface Field {
  options: FieldOptions;
}

export type FieldElement = MrkdwnElement | PlainTextElement;

export type FieldKeyword = '{REF}' | '{STATUS}';
