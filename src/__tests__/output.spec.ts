import { endGroup, setOutput, startGroup } from '@actions/core';
import expect from 'expect';
import Output from '../output';

jest.mock('@actions/core', () => ({
  ...jest.requireActual('@actions/core'),
  startGroup: jest.fn(),
  setOutput: jest.fn(),
  endGroup: jest.fn(),
}));

describe('output', () => {
  describe('set()', () => {
    let output: Output;

    beforeAll(() => {
      output = new Output();
      output.slackTimestamp = 'test';
    });

    it('sets outputs', async () => {
      await output.set();
      expect(startGroup).toHaveBeenCalledWith('Set output');
      expect(setOutput).toHaveBeenCalledWith('slack-timestamp', 'test');
      expect(endGroup).toHaveBeenCalledWith();
    });
  });
});
