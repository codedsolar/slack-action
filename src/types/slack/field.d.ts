import { MrkdwnElement, PlainTextElement } from '@slack/bolt';
import { Status } from '../../status';

export interface Field {
  // eslint-disable-next-line no-use-before-define
  options: FieldOptions;
}

export type FieldKeyword = '{REF}' | '{STATUS}';

export type FieldType = 'mrkdwn' | 'plain_text';

export interface FieldOptions {
  keywords?: {
    // eslint-disable-next-line no-unused-vars
    [key in FieldKeyword | string]: (field: Field) => [string, string];
  };
  name?: string;
  status?: Status;
  type?: FieldType;
  value: FieldKeyword | string;
}

export type FieldElement = MrkdwnElement | PlainTextElement;
