import * as github from '@actions/github';
import * as helpers from '../helpers';
import {
  Field as BaseField,
  FieldElement,
  FieldKeyword,
  FieldOptions,
} from '../types';
import status from '../status';

export default class Field implements BaseField {
  private name: string;

  private value: string;

  public options: FieldOptions;

  constructor(options: FieldOptions) {
    this.name = options.name || '';
    this.options = options;
    this.value = options.value || '';
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

  public setByKeyword(keyword: FieldKeyword) {
    let name;
    let value;

    switch (keyword) {
      case '{REF}':
        [name, value] = Field.keywordRefFn();
        this.name = name;
        this.value = value;
        break;
      case '{STATUS}':
        [name, value] = Field.keywordStatusFn(this);
        this.name = name;
        this.value = value;
        break;
      default:
        break;
    }
  }

  public get(): FieldElement {
    return {
      type: this.options.type || 'mrkdwn',
      text: `*${this.name}*\n${this.value}`,
    };
  }
}
