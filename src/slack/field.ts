import * as github from '@actions/github';
import { MrkdwnElement, PlainTextElement } from '@slack/bolt';
import * as helpers from '../helpers';
import status, { StatusOptions } from '../status';

export type FieldElement = MrkdwnElement | PlainTextElement;
export type FieldKeyword = '{REF}' | '{STATUS}';
export type FieldType = 'mrkdwn' | 'plain_text';

export interface FieldOptions {
  keywords?: {
    // eslint-disable-next-line no-unused-vars
    [key in FieldKeyword | string]: (field: any) => [string, string];
  };
  name?: string;
  status?: StatusOptions;
  type?: FieldType;
  value: FieldKeyword | string;
}

export default class Field {
  public options: FieldOptions;

  constructor(options: FieldOptions) {
    this.options = options;
  }

  public static keywordRefFn(field: Field): [string, string] {
    const { eventName, issue } = github.context;

    switch (eventName) {
      case 'pull_request':
        return [
          'Pull Request',
          field.options.type === 'plain_text'
            ? `#${issue.number}`
            : `<${helpers.getPRUrl()}|#${issue.number}>`,
        ];
      case 'push':
        return [
          'Commit',
          field.options.type === 'plain_text'
            ? `${helpers.getCommitShort()} (${helpers.getBranchName()})`
            : `<${helpers.getCommitUrl()}|\`${helpers.getCommitShort()} (${helpers.getBranchName()})\`>`,
        ];
      default:
        return [
          'Commit',
          field.options.type === 'plain_text'
            ? helpers.getCommitShort()
            : `<${helpers.getCommitUrl()}|\`${helpers.getCommitShort()}\`>`,
        ];
    }
  }

  public static keywordStatusFn(field: Field): [string, string] {
    return [
      'Status',
      field.options.status !== undefined
        ? field.options.status.title
        : status.unknown.title,
    ];
  }

  public get(): FieldElement {
    let name: string = this.options.name || '';
    let value: string = this.options.value || '';

    if (this.options.keywords !== undefined) {
      const keywordFn = this.options.keywords[value];
      if (keywordFn) {
        [name, value] = keywordFn(this);
      }
    }

    if (this.options.type === 'plain_text') {
      return {
        type: this.options.type,
        text: `${name}\n${value}`,
      };
    }

    return {
      type: this.options.type || 'mrkdwn',
      text: `*${name}*\n${value}`,
    };
  }
}
