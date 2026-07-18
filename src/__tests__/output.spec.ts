import { jest } from '@jest/globals';

jest.unstable_mockModule('@actions/core', () => ({
  startGroup: jest.fn(),
  setOutput: jest.fn(),
  endGroup: jest.fn(),
}));

const core = await import('@actions/core');
const { default: Output } = await import('../output.js');

describe('output', () => {
  describe('set()', () => {
    let output: InstanceType<typeof Output>;

    beforeAll(() => {
      output = new Output();
      output.slackTimestamp = 'test';
    });

    it('sets outputs', async () => {
      await output.set();
      expect(core.startGroup).toHaveBeenCalledWith('Set output');
      expect(core.setOutput).toHaveBeenCalledWith('slack-timestamp', 'test');
      expect(core.endGroup).toHaveBeenCalledWith();
    });
  });
});
