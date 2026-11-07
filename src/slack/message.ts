import * as core from '@actions/core';
import type { MrkdwnElement, PlainTextElement } from '@slack/types';
import Field, { FieldKeyword } from './field.js';
import Slack from './slack.js';
import Text from './text.js';
import { StatusOptions } from '../status.js';

export interface MessageOptions {
  fields: string[];
  status: StatusOptions;
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

  private async postToSlack(): Promise<string> {
    this.timestamp = await this.slack.post(this);
    return this.timestamp;
  }

  private async updateSlack(): Promise<string> {
    this.timestamp = await this.slack.update(this);
    return this.timestamp;
  }

  public getFields(): Array<PlainTextElement | MrkdwnElement> {
    const result: MrkdwnElement[] = [];
    const keywords: FieldKeyword[] = ['{REF}', '{STATUS}'];

    for (const element of this.options.fields) {
      const matches = element.match(/({.*?})/g);
      if (matches !== null) {
        for (const match of matches) {
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
        }
        continue;
      }

      const separator = element.indexOf(':');
      if (separator === -1) {
        core.warning(
          `Ignoring malformed Slack field (expected "name: value"): ${element}`,
        );
        continue;
      }

      const name = element.slice(0, separator).trim();
      const value = element.slice(separator + 1).trim();
      if (name.length === 0) {
        core.warning(`Ignoring malformed Slack field (empty name): ${element}`);
        continue;
      }

      const field = new Field({ name, value });
      result.push(field.get() as MrkdwnElement);
    }

    return result;
  }

  public getText(): string {
    return new Text().set(this.options.text).get();
  }

  public async post(): Promise<string> {
    return this.postToSlack();
  }

  public async update(): Promise<string> {
    return this.updateSlack();
  }
}
