/* eslint-env jest */
import { testFunctions } from '../../scripts/aem-assets.js';

const { appendQueryParams } = testFunctions;
// scripts/aem-assets.test.js

describe('appendQueryParams', () => {
  it('should append allowed query parameters', () => {
    const url = new URL('https://example.com');
    const params = new Map([['rotate', '90'], ['crop', 'center']]);
    const result = appendQueryParams(url, params);
    expect(result).toBe('https://example.com/?rotate=90&crop=center');
  });

  it('should ignore disallowed query parameters', () => {
    const url = new URL('https://example.com');
    const params = new Map([['foo', 'bar'], ['rotate', '90']]);
    const result = appendQueryParams(url, params);
    expect(result).toBe('https://example.com/?foo=bar&rotate=90');
  });

  it('should handle empty parameters', () => {
    const url = new URL('https://example.com');
    const params = new Map();
    const result = appendQueryParams(url, params);
    expect(result).toBe('https://example.com/');
  });

  it('should handle URLs with existing query parameters', () => {
    const url = new URL('https://example.com?existing=param');
    const params = new Map([['rotate', '90']]);
    const result = appendQueryParams(url, params);
    expect(result).toBe('https://example.com/?existing=param&rotate=90');
  });
});
