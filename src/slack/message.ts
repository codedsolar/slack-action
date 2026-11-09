import * as core from '@actions/core';
import type { MrkdwnElement, PlainTextElement } from '@slack/types';
import Field, { FieldKeyword } from './field.js';
import type { MergeFence, NamedField } from './fields.js';
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

  /**
   * When set (e.g. merge-mode updates), used instead of interpolating
   * `options.text`.
   */
  public textOverride: string = '';

  /**
   * OCC fence written into Slack message metadata (not attachment fields).
   */
  public mergeFence: MergeFence | undefined;

  constructor(slack: Slack, options: MessageOptions) {
    this.options = options;
    this.slack = slack;
    this.timestamp = '';
    this.mergeFence = undefined;
  }

  private async postToSlack(): Promise<string> {
    this.timestamp = await this.slack.post(this);
    return this.timestamp;
  }

  private async updateSlack(): Promise<string> {
    this.timestamp = await this.slack.update(this);
    return this.timestamp;
  }

  public getNamedFields(): NamedField[] {
    const result: NamedField[] = [];
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
            const keywordFn =
              match === '{REF}' ? Field.keywordRefFn : Field.keywordStatusFn;
            const [name, value] = keywordFn(field);
            result.push({ name, value });
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

      result.push({ name, value });
    }

    return result;
  }

  public getFields(): Array<PlainTextElement | MrkdwnElement> {
    return this.getNamedFields().map(
      (field) =>
        new Field({
          name: field.name,
          value: field.value,
        }).get() as MrkdwnElement,
    );
  }

  public getText(): string {
    if (this.textOverride.length > 0) {
      return this.textOverride;
    }
    return new Text().set(this.options.text).get();
  }

  public async post(): Promise<string> {
    return this.postToSlack();
  }

  public async update(): Promise<string> {
    return this.updateSlack();
  }
}
