import * as github from '@actions/github';
import { MrkdwnElement, PlainTextElement } from '@slack/bolt';
import * as helpers from '../helpers';
import status, { Status } from '../status';
import { FieldKeyword } from '../types/slack/field';
import Field from './field';
import Slack from './slack';

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

  private static getActor(): string {
    return `<${helpers.getActorUrl()}|${helpers.getActor()}>`;
  }

  private static getJob(): string {
    return `<${helpers.getWorkflowUrl()}|${helpers.getWorkflow()} / ${helpers.getJob()}>`;
  }

  private static getRef(): string {
    const {
      eventName,
      issue,
      repo: { owner, repo },
      serverUrl,
    } = github.context;

    const repoUrl: string = `${serverUrl}/${owner}/${repo}`;
    let branchName: string = '';
    let result: string = `<${repoUrl}|${owner}/${repo}>`;
    let url: string = '';

    switch (eventName) {
      case 'pull_request':
        if (issue.number > 0) {
          url = `${repoUrl}/pull/${issue.number}`;
          result = `${result}#<${url}|${issue.number}>`;
        }
        break;
      case 'push':
        branchName = helpers.getBranchName();
        if (branchName.length > 0) {
          url = `${repoUrl}/tree/${branchName}`;
          result = `${result}@<${url}|${branchName}>`;
        }
        break;
      default:
        break;
    }

    return result;
  }

  private static interpolateTextTemplates(text: string): string {
    let result = text;
    const matches = text.match(/({.*?})/g);
    if (matches === null) {
      return text;
    }

    matches.forEach((element) => {
      switch (element) {
        case '{GITHUB_ACTOR}':
          result = result.replace(element, Message.getActor());
          break;
        case '{GITHUB_JOB}':
          result = result.replace(element, Message.getJob());
          break;
        case '{GITHUB_REF}':
          result = result.replace(element, Message.getRef());
          break;
        default:
          break;
      }
    });

    return result;
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
    return Message.interpolateTextTemplates(this.text);
  }

  public async post(): Promise<string> {
    return this.callFnAndUpdateTimestamp('post');
  }

  public async update(): Promise<string> {
    return this.callFnAndUpdateTimestamp('update');
  }
}
