import * as core from '@actions/core';
import { sprintf } from 'sprintf-js';
import { App } from '@slack/bolt';
import {
  ChatPostMessageArguments,
  ChatUpdateArguments,
  ErrorCode,
  WebAPIPlatformError,
} from '@slack/web-api';
import Message from './message.js';
import {
  buildMergeMetadata,
  isLegacyMergeFenceField,
  parseFieldText,
  parseMergeFence,
} from './fields.js';
import type { MergeFence, NamedField } from './fields.js';
import constants from '../constants.js';

export interface FetchedMessage {
  color: string;
  fence: MergeFence;
  fields: NamedField[];
  text: string;
}

export interface SlackOptions {
  channel: string;
  signingSecret: string;
  token: string;
}

export default class Slack {
  private app: App | null;

  private channelID: string;

  private totalPortRetries: number;

  private options: SlackOptions;

  public isRunning: boolean;

  constructor(options: SlackOptions) {
    this.app = null;
    this.channelID = '';
    this.isRunning = false;
    this.options = options;
    this.totalPortRetries = 0;
  }

  private async appStart(port: number, portRetries: number) {
    this.app = new App({
      signingSecret: this.options.signingSecret,
      token: this.options.token,
    });

    core.debug(`Checking port ${port}...`);
    await this.app
      .start(port)
      .then(() => core.info('Started Slack app'))
      .catch((error) => {
        if (error.code === 'EADDRINUSE') {
          if (this.totalPortRetries === 0 || this.totalPortRetries < 0) {
            throw new Error(
              sprintf(constants.ERROR.PORT_IS_ALREADY_IN_USE, port),
            );
          }

          const newPort = port + 1;
          const newPortRetries = portRetries - 1;
          core.debug(sprintf(constants.ERROR.PORT_IS_ALREADY_IN_USE, port));
          if (newPortRetries >= 0) {
            core.debug(`Retrying (${portRetries} retries left)...`);
            return this.appStart(newPort, newPortRetries);
          }

          throw new Error(
            sprintf(
              constants.ERROR.PORTS_ARE_ALREADY_IN_USE,
              port,
              port + this.totalPortRetries,
            ),
          );
        }
        throw error;
      });
  }

  private async appFindChannel(name: string): Promise<object | null> {
    if (!this.app) {
      return null;
    }

    core.debug(`Finding #${name} channel...`);
    try {
      const result = await this.app.client.conversations.list({
        token: this.options.token,
      });

      if (!result.channels) {
        return result;
      }

      for (const channel of result.channels as { id: string; name: string }[]) {
        if (channel.name === name) {
          this.channelID = channel.id;
          core.debug(`Found channel ID: ${this.channelID}`);
          core.info(`Found #${channel.name} channel`);
          return result;
        }
      }
    } catch (error) {
      return Promise.reject(error);
    }

    throw new Error(constants.ERROR.CHANNEL_NOT_FOUND);
  }

  public async start(
    port: number = 3000,
    portRetries: number = 3,
  ): Promise<void | Error> {
    if (this.isRunning) {
      throw new Error(constants.ERROR.ALREADY_RUNNING);
    }

    if (
      this.options.signingSecret.length === 0 ||
      this.options.token.length === 0
    ) {
      throw new Error(constants.ERROR.TOKEN_NOT_FOUND);
    }

    core.startGroup('Start Slack app');
    core.debug('Starting Slack app...');
    try {
      this.totalPortRetries = portRetries;
      await this.appStart(port, portRetries);
      await this.appFindChannel(this.options.channel);
      this.isRunning = true;
      core.endGroup();
      return Promise.resolve();
    } catch (error) {
      this.isRunning = false;
      core.endGroup();
      return Promise.reject(error);
    }
  }

  public async fetchMessage(ts: string): Promise<FetchedMessage> {
    if (!this.app || !this.isRunning) {
      throw new Error(constants.ERROR.NOT_RUNNING);
    }

    if (ts.length === 0) {
      throw new Error(constants.ERROR.UNDEFINED_MESSAGE_TIMESTAMP);
    }

    core.debug(`Fetching Slack message (timestamp: ${ts})...`);
    let result;
    try {
      result = await this.app.client.conversations.history({
        channel: this.channelID,
        latest: ts,
        oldest: ts,
        inclusive: true,
        include_all_metadata: true,
        limit: 1,
        token: this.options.token,
      });
    } catch (error) {
      if (
        error instanceof WebAPIPlatformError &&
        error.code === ErrorCode.PlatformError
      ) {
        if (error.data.error === 'missing_scope') {
          throw new Error(constants.ERROR.MISSING_HISTORY_SCOPE, {
            cause: error,
          });
        }

        if (error.data.error === 'not_in_channel') {
          throw new Error(constants.ERROR.NOT_IN_CHANNEL, { cause: error });
        }
      }
      throw error;
    }

    const message = result.messages?.[0];
    if (message === undefined || message.ts !== ts) {
      throw new Error(constants.ERROR.MESSAGE_NOT_FOUND);
    }

    const fields: NamedField[] = [];
    const attachments = message.attachments ?? [];
    let color = '';

    for (const attachment of attachments) {
      if (typeof attachment.color === 'string' && attachment.color.length > 0) {
        color = attachment.color;
      }

      const blocks = attachment.blocks ?? [];
      for (const block of blocks) {
        if (block.type !== 'section' || !('fields' in block) || !block.fields) {
          continue;
        }

        for (const field of block.fields) {
          if (typeof field.text === 'string') {
            const parsed = parseFieldText(field.text);
            if (parsed !== null && !isLegacyMergeFenceField(parsed.name)) {
              fields.push(parsed);
            }
          }
        }
      }
    }

    return {
      color,
      fence: parseMergeFence(message.metadata),
      fields,
      text: typeof message.text === 'string' ? message.text : '',
    };
  }

  public async post(msg: Message): Promise<string> {
    if (!this.app || !this.isRunning) {
      throw new Error(constants.ERROR.NOT_RUNNING);
    }

    core.debug('Posting Slack message...');
    const fields = msg.getFields();

    let options: ChatPostMessageArguments = {
      channel: this.channelID,
      text: msg.getText(),
      token: this.options.token,
    };

    if (fields.length > 0) {
      options = {
        ...options,
        attachments: [
          {
            color: msg.options.status.color,
            blocks: [{ type: 'section', fields }],
          },
        ],
      };
    }

    if (msg.mergeFence !== undefined) {
      options = {
        ...options,
        metadata: buildMergeMetadata(msg.mergeFence),
      };
    }

    const result = await this.app.client.chat.postMessage(options);
    if (typeof result.ts === 'string' && result.ts.length > 0) {
      core.info('Posted Slack message');
      core.debug(`Timestamp: ${result.ts}`);
      return result.ts;
    }

    return '';
  }

  public async update(msg: Message): Promise<string> {
    if (!this.app || !this.isRunning) {
      throw new Error(constants.ERROR.NOT_RUNNING);
    }

    if (msg.timestamp.length === 0) {
      throw new Error(constants.ERROR.UNDEFINED_MESSAGE_TIMESTAMP);
    }

    core.debug(`Updating Slack message (timestamp: ${msg.timestamp})...`);
    const fields = msg.getFields();
    let options: ChatUpdateArguments = {
      channel: this.channelID,
      text: msg.getText(),
      token: this.options.token,
      ts: msg.timestamp,
      attachments:
        fields.length > 0
          ? [
              {
                color: msg.options.status.color,
                blocks: [{ type: 'section', fields }],
              },
            ]
          : [],
    };

    if (msg.mergeFence !== undefined) {
      options = {
        ...options,
        metadata: buildMergeMetadata(msg.mergeFence),
      };
    }

    const result = await this.app.client.chat.update(options);
    if (typeof result.ts === 'string' && result.ts.length > 0) {
      core.info('Updated Slack message');
      return result.ts;
    }

    return '';
  }

  public async addReaction(ts: string, name: string): Promise<void> {
    if (!this.app || !this.isRunning) {
      throw new Error(constants.ERROR.NOT_RUNNING);
    }

    if (ts.length === 0) {
      throw new Error(constants.ERROR.UNDEFINED_MESSAGE_TIMESTAMP);
    }

    try {
      await this.app.client.reactions.add({
        channel: this.channelID,
        name,
        timestamp: ts,
        token: this.options.token,
      });
    } catch (error) {
      if (
        error instanceof WebAPIPlatformError &&
        error.code === ErrorCode.PlatformError &&
        error.data.error === 'missing_scope'
      ) {
        throw new Error(constants.ERROR.MISSING_REACTIONS_SCOPE, {
          cause: error,
        });
      }
      throw error;
    }
  }

  public async removeReaction(ts: string, name: string): Promise<void> {
    if (!this.app || !this.isRunning) {
      throw new Error(constants.ERROR.NOT_RUNNING);
    }

    if (ts.length === 0) {
      throw new Error(constants.ERROR.UNDEFINED_MESSAGE_TIMESTAMP);
    }

    try {
      await this.app.client.reactions.remove({
        channel: this.channelID,
        name,
        timestamp: ts,
        token: this.options.token,
      });
    } catch (error) {
      if (
        error instanceof WebAPIPlatformError &&
        error.code === ErrorCode.PlatformError
      ) {
        if (error.data.error === 'missing_scope') {
          throw new Error(constants.ERROR.MISSING_REACTIONS_SCOPE, {
            cause: error,
          });
        }
        if (error.data.error === 'no_reaction') {
          return;
        }
      }
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.app || !this.isRunning) {
      return;
    }

    core.startGroup('Stop Slack app');
    core.debug('Stopping Slack app...');
    try {
      await this.app.stop();
      core.info('Stopped Slack app');
      this.isRunning = false;
      core.endGroup();
    } catch (error) {
      core.endGroup();
      throw error;
    }
  }
}
