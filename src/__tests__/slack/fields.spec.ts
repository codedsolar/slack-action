import {
  MERGE_METADATA_EVENT_TYPE,
  buildMergeMetadata,
  incomingFieldsConfirmed,
  mergeAttemptSucceeded,
  mergeNamedFields,
  namedFieldsEqual,
  parseFieldText,
  parseMergeFence,
  stripLegacyMergeFenceFields,
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

    it('strips legacy fence fields from existing and ignores them in incoming', () => {
      expect(
        mergeNamedFields(
          [
            { name: 'A', value: '1' },
            { name: '_merge_rev', value: '9' },
            { name: '_merge_writer', value: 'old' },
          ],
          [
            { name: '_merge_rev', value: '99' },
            { name: 'B', value: '2' },
          ],
        ),
      ).toEqual([
        { name: 'A', value: '1' },
        { name: 'B', value: '2' },
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

  describe('merge metadata fence', () => {
    it('parses and builds metadata fences', () => {
      expect(parseMergeFence(undefined)).toEqual({ rev: 0, writer: '' });
      expect(
        parseMergeFence({
          event_type: 'other',
          event_payload: { merge_rev: 3, merge_writer: 'x' },
        }),
      ).toEqual({ rev: 0, writer: '' });

      expect(
        parseMergeFence({
          event_type: MERGE_METADATA_EVENT_TYPE,
          event_payload: { merge_rev: 3, merge_writer: 'w1' },
        }),
      ).toEqual({ rev: 3, writer: 'w1' });

      expect(buildMergeMetadata({ rev: 4, writer: 'w2' })).toEqual({
        event_type: MERGE_METADATA_EVENT_TYPE,
        event_payload: {
          merge_rev: 4,
          merge_writer: 'w2',
        },
      });
    });

    it('strips legacy visible fence fields', () => {
      expect(
        stripLegacyMergeFenceFields([
          { name: 'A', value: '1' },
          { name: '_merge_rev', value: '1' },
          { name: '_merge_writer', value: 'w' },
        ]),
      ).toEqual([{ name: 'A', value: '1' }]);
    });
  });

  describe('namedFieldsEqual()', () => {
    it('compares name→value maps ignoring order', () => {
      expect(
        namedFieldsEqual(
          [
            { name: 'A', value: '1' },
            { name: 'B', value: '2' },
          ],
          [
            { name: 'B', value: '2' },
            { name: 'A', value: '1' },
          ],
        ),
      ).toBe(true);

      expect(
        namedFieldsEqual(
          [{ name: 'A', value: 'Pending...' }],
          [{ name: 'A', value: 'Completed' }],
        ),
      ).toBe(false);
    });
  });

  describe('incomingFieldsConfirmed()', () => {
    it('requires every consumer incoming name/value on live', () => {
      expect(
        incomingFieldsConfirmed(
          [
            { name: 'A', value: '1' },
            { name: 'B', value: '2' },
          ],
          [{ name: 'A', value: '1' }],
        ),
      ).toBe(true);

      expect(
        incomingFieldsConfirmed(
          [{ name: 'A', value: 'Pending...' }],
          [{ name: 'A', value: 'Completed' }],
        ),
      ).toBe(false);
    });
  });

  describe('mergeAttemptSucceeded()', () => {
    it('requires matching fence and incoming fields', () => {
      const liveFields = [{ name: 'A', value: '1' }];

      expect(
        mergeAttemptSucceeded({ rev: 2, writer: 'w1' }, 2, 'w1', liveFields, [
          { name: 'A', value: '1' },
        ]),
      ).toBe(true);
      expect(
        mergeAttemptSucceeded(
          { rev: 2, writer: 'other' },
          2,
          'w1',
          liveFields,
          [{ name: 'A', value: '1' }],
        ),
      ).toBe(false);
    });
  });
});
