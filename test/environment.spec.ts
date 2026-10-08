import { getCorsOrigins } from '../src/config/environment';

describe('getCorsOrigins', () => {
  it('parses and trims comma-separated origins', () => {
    expect(getCorsOrigins('https://one.test, https://two.test')).toEqual([
      'https://one.test',
      'https://two.test',
    ]);
  });

  it('returns an empty list for an absent value', () => {
    expect(getCorsOrigins(undefined)).toEqual([]);
  });
});
