import { MrkdwnElement } from '@slack/bolt';
import { Status } from '../../status';

export type FieldType = 'mrkdwn';

export interface FieldOptions {
  name?: string;
  status?: Status;
  type?: FieldType;
  value: string;
}

export interface Field {
  options: FieldOptions;
}

export type FieldElement = MrkdwnElement | null;

export type FieldKeyword = '{REF}' | '{STATUS}';
