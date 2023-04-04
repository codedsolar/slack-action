import * as github from '@actions/github';
import * as helpers from '../helpers';
import { Field as BaseField, FieldElement, FieldOptions } from '../types';
import status from '../status';

export default class Field implements BaseField {
  public options: FieldOptions;

  constructor(options: FieldOptions) {
    this.options = options;
  }

  public static keywordRefFn(field: BaseField): [string, string] {
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

  public static keywordStatusFn(field: BaseField): [string, string] {
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

    switch (value) {
      case '{REF}':
        [name, value] = Field.keywordRefFn(this);
        break;
      case '{STATUS}':
        [name, value] = Field.keywordStatusFn(this);
        break;
      default:
        break;
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
