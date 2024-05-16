import { MrkdwnElement, PlainTextElement } from '@slack/bolt';
import Field, { FieldKeyword } from './field';
import Slack from './slack';
import Text from './text';
import { Status } from '../status';

export interface MessageOptions {
  fields: string[];
  status: Status;
  text: string;
}

export default class Message {
  public readonly slack: Slack;

  public timestamp: string;

  public options: MessageOptions;

  constructor(slack: Slack, options: MessageOptions) {
    this.options = options;
    this.slack = slack;
    this.timestamp = '';
  }

  private async callFn(fn: string): Promise<string> {
    this.timestamp = await this.slack[fn](this);
    return this.timestamp;
  }

  public getFields(): Array<PlainTextElement | MrkdwnElement> {
    const result: MrkdwnElement[] = [];

    this.options.fields.forEach((element) => {
      const keywords: FieldKeyword[] = ['{REF}', '{STATUS}'];
      const matches = element.match(/({.*?})/g);
      if (matches !== null) {
        matches.forEach((match) => {
          if (keywords.includes(match as FieldKeyword)) {
            const field = new Field({
              keywords: {
                '{REF}': Field.keywordRefFn,
                '{STATUS}': Field.keywordStatusFn,
              },
              status: this.options.status,
              value: match as FieldKeyword,
            });
            result.push(field.get() as MrkdwnElement);
          }
        });
        return result;
      }

      const split = element.split(':');
      if (split.length === 2) {
        const field = new Field({
          name: split[0].trim(),
          value: split[1].trim(),
        });
        result.push(field.get() as MrkdwnElement);
      }

      return result;
    });

    return result;
  }

  public getText(): string {
    return new Text().set(this.options.text).get();
  }

  public async post(): Promise<string> {
    return this.callFn('post');
  }

  public async update(): Promise<string> {
    return this.callFn('update');
  }
}
