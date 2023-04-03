import { Status } from '../../status';

export interface MessageOptions {
  fields: string[];
  status: Status;
  text: string;
}
