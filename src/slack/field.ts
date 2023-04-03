import * as github from '@actions/github';
import * as helpers from '../helpers';
import {
  Field as BaseField,
  FieldElement,
  FieldKeyword,
  FieldType,
} from '../types';
import status, { Status } from '../status';

export default class Field implements BaseField {
  public name: string;

  public status: Status = status.unknown;

  public type: FieldType = 'mrkdwn';

  public value: string;

  constructor(name?: string, value?: string) {
    this.name = name || '';
    this.value = value || '';
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
    return ['Status', field.status.title];
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
    if (this.type !== 'mrkdwn') {
      return null;
    }

    return {
      type: this.type,
      text: `*${this.name}*\n${this.value}`,
    };
  }
}
