import * as github from '@actions/github';
import * as helpers from '../helpers';
import { Field as BaseField, FieldElement, FieldOptions } from '../types';
import status from '../status';

export default class Field implements BaseField {
  public options: FieldOptions;

  constructor(options: FieldOptions) {
    this.options = options;
  }

  public static keywordRefFn(): [string, string] {
    const { eventName, issue } = github.context;

    switch (eventName) {
      case 'pull_request':
        return ['Pull Request', `<${helpers.getPRUrl()}|#${issue.number}>`];
      case 'push':
        return [
          'Commit',
          `<${helpers.getCommitUrl()}|\`${helpers.getCommitShort()} (${helpers.getBranchName()})\`>`,
        ];
      default:
        return [
          'Commit',
          `<${helpers.getCommitUrl()}|\`${helpers.getCommitShort()}\`>`,
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
    let name = this.options.name || '';
    let value = this.options.value || '';

    switch (value) {
      case '{REF}':
        [name, value] = Field.keywordRefFn();
        break;
      case '{STATUS}':
        [name, value] = Field.keywordStatusFn(this);
        break;
      default:
        break;
    }

    return {
      type: this.options.type || 'mrkdwn',
      text: `*${name}*\n${value}`,
    };
  }
}
