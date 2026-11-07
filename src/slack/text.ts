import * as github from '@actions/github';
import * as helpers from '../helpers.js';

export default class Text {
  private value: string =
    'GitHub Actions {GITHUB_JOB} job in {GITHUB_REF} by {GITHUB_ACTOR}';

  public static getMrkdwnActor(): string {
    return `<${helpers.getActorUrl()}|${helpers.getActor()}>`;
  }

  public static getMrkdwnJob(): string {
    return `<${helpers.getWorkflowUrl()}|${helpers.getWorkflow()} / ${helpers.getJob()}>`;
  }

  public static getMrkdwnRef(): string {
    const {
      eventName,
      issue,
      repo: { owner, repo },
      serverUrl,
    } = github.context;

    const repoUrl: string = `${serverUrl}/${owner}/${repo}`;
    let branchName: string;
    let result: string = `<${repoUrl}|${owner}/${repo}>`;
    let url: string;

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

  private interpolateKeywords() {
    this.value = this.value.replace(/({.*?})/g, (keyword) => {
      switch (keyword) {
        case '{GITHUB_ACTOR}':
          return Text.getMrkdwnActor();
        case '{GITHUB_JOB}':
          return Text.getMrkdwnJob();
        case '{GITHUB_REF}':
          return Text.getMrkdwnRef();
        default:
          return keyword;
      }
    });
  }

  public set(value: string): Text {
    this.value = value;
    return this;
  }

  public get(): string {
    this.interpolateKeywords();
    return this.value;
  }
}
