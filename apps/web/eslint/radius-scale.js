/**
 * Shared with eslint.config.js and radius-scale.test.ts so the enforced
 * pattern and its test stay in sync — the eslint rule embeds these as
 * selector regex source strings, since flat config selectors must be string
 * literals rather than RegExp values.
 */
export const OFF_SCALE_RADIUS_SOURCE =
  '(?:^|\\s)rounded-(?:2xl|3xl|4xl)(?:\\s|$)'

export const ARBITRARY_RADIUS_SOURCE =
  'rounded-(?:[trbl]-)?\\[(?!inherit\\]|.*var\\(--radius)'

export const offScaleRadius = new RegExp(OFF_SCALE_RADIUS_SOURCE)
export const arbitraryRadius = new RegExp(ARBITRARY_RADIUS_SOURCE)
