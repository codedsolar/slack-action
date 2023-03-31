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

/* eslint-disable no-shadow, no-unused-vars */
export enum FieldKeyword {
  REF = '{REF}',
  STATUS = '{STATUS}',
}
/* eslint-enable no-shadow, no-unused-vars */
