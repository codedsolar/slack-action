import { MrkdwnElement, PlainTextElement } from '@slack/bolt';
import status, { Status } from '../status';
import Field from './field';
import { FieldKeyword } from '../types';
import Slack from './slack';
import Text from './text';

export default class Message {
  private fields: string[];

  private readonly slack: Slack;

  public status: Status;

  public text: string;

  public timestamp: string;

  constructor(slack: Slack, text?: string, _status?: Status) {
    this.fields = ['{STATUS}', '{REF}'];
    this.slack = slack;
    this.status = _status === undefined ? status.unknown : _status;
    this.text =
      text !== undefined && text.length > 0
        ? text
        : 'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}';
    this.timestamp = '';
  }

  private async callFnAndUpdateTimestamp(fn: string): Promise<string> {
    this.timestamp = await this.slack[fn](this);
    return this.timestamp;
  }

  public setFields(fields: string[]): void {
    this.fields = fields;
  }

  public getFields(): Array<PlainTextElement | MrkdwnElement> {
    const result: MrkdwnElement[] = [];

    this.fields.forEach((element) => {
      const keywords: FieldKeyword[] = ['{REF}', '{STATUS}'];
      const matches = element.match(/({.*?})/g);
      if (matches !== null) {
        matches.forEach((match) => {
          if (Object.values(keywords).includes(match as FieldKeyword)) {
            const field = new Field();
            field.status = this.status;
            field.setByKeyword(match as FieldKeyword);
            result.push(field.get() as MrkdwnElement);
          }
        });
        return result;
      }

      const split = element.split(':');
      if (split.length === 2) {
        const field = new Field();
        field.name = split[0].trim();
        field.value = split[1].trim();
        result.push(field.get() as MrkdwnElement);
      }

      return result;
    });

    return result;
  }

  public getText(): string {
    return new Text().set(this.text).get();
  }

  public async post(): Promise<string> {
    return this.callFnAndUpdateTimestamp('post');
  }

  public async update(): Promise<string> {
    return this.callFnAndUpdateTimestamp('update');
  }
}
