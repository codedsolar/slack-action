import {
  mergeNamedFields,
  parseFieldText,
  toFieldLines,
} from '../../slack/fields.js';

describe('fields helpers', () => {
  describe('parseFieldText()', () => {
    it('parses mrkdwn field text', () => {
      expect(parseFieldText('*Status*\nSuccess')).toEqual({
        name: 'Status',
        value: 'Success',
      });
    });

    it('parses plain field text', () => {
      expect(parseFieldText('ESLint issues\n0')).toEqual({
        name: 'ESLint issues',
        value: '0',
      });
    });

    it('keeps values that span lines', () => {
      expect(parseFieldText('*URL*\nhttps://example.com:8443/path')).toEqual({
        name: 'URL',
        value: 'https://example.com:8443/path',
      });
    });

    it('returns null for empty or malformed text', () => {
      expect(parseFieldText('')).toBeNull();
      expect(parseFieldText('no-separator')).toBeNull();
    });
  });

  describe('mergeNamedFields()', () => {
    it('overlays matching names and appends new ones', () => {
      expect(
        mergeNamedFields(
          [
            { name: 'Status', value: 'In Progress' },
            { name: 'ESLint issues', value: 'Checking...' },
          ],
          [{ name: 'ESLint issues', value: '0' }],
        ),
      ).toEqual([
        { name: 'Status', value: 'In Progress' },
        { name: 'ESLint issues', value: '0' },
      ]);

      expect(
        mergeNamedFields(
          [{ name: 'Status', value: 'In Progress' }],
          [{ name: 'Prettier issues', value: '2' }],
        ),
      ).toEqual([
        { name: 'Status', value: 'In Progress' },
        { name: 'Prettier issues', value: '2' },
      ]);
    });
  });

  describe('toFieldLines()', () => {
    it('formats name/value pairs as field lines', () => {
      expect(
        toFieldLines([
          { name: 'Status', value: 'Success' },
          { name: 'URL', value: 'https://example.com:8443' },
        ]),
      ).toEqual(['Status: Success', 'URL: https://example.com:8443']);
    });
  });
});
