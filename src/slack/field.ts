import * as github from '@actions/github';
import * as helpers from '../helpers';
import {
  Field as BaseField,
  FieldElement,
  FieldKeyword,
  FieldType,
} from '../types/slack/field';
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

  public setToRef() {
    const { eventName, issue } = github.context;

    switch (eventName) {
      case 'pull_request':
        if (issue.number > 0) {
          this.name = 'Pull Request';
          this.value = `<${helpers.getPRUrl()}|#${issue.number}>`;
        }
        break;
      case 'push':
        this.name = 'Commit';
        this.value = `<${helpers.getCommitUrl()}|\`${helpers.getCommitShort()} (${helpers.getBranchName()})\`>`;
        break;
      default:
        this.name = 'Commit';
        this.value = `<${helpers.getCommitUrl()}|\`${helpers.getCommitShort()}\`>`;
    }
  }

  public setToStatus() {
    this.name = 'Status';
    this.value = this.status.title;
  }

  public setByKeyword(keyword: FieldKeyword) {
    switch (keyword) {
      case '{REF}':
        this.setToRef();
        break;
      case '{STATUS}':
        this.setToStatus();
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
