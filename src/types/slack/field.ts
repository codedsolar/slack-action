import { MrkdwnElement } from '@slack/bolt';
import { Status } from '../../status';

export type FieldType = 'mrkdwn';

export interface Field {
  name: string;
  status: Status;
  type: FieldType;
  value: string;
}

export type FieldElement = MrkdwnElement | null;

export type FieldKeyword = '{REF}' | '{STATUS}';
