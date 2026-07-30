//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import {
  ARBITRARY_RADIUS_SOURCE,
  OFF_SCALE_RADIUS_SOURCE,
} from './eslint/radius-scale.js'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      /* There is exactly one corner radius token (--radius). rounded-full and
       * rounded-none are shapes, not scale tiers, so they're exempt. Every
       * other rounded-* class must come from the sm/md/lg/xl/2xl/3xl/4xl tiers
       * (all aliased to --radius) or an arbitrary value derived from
       * var(--radius) — never a bare pixel/rem arbitrary value, which would
       * silently drift off the token. */
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${OFF_SCALE_RADIUS_SOURCE}/]`,
          message:
            'Off-scale radius class. This app uses one corner radius (--radius) — use rounded-sm/md/lg/xl (or rounded-full/rounded-none) instead of rounded-2xl/3xl/4xl.',
        },
        {
          selector: `Literal[value=/${ARBITRARY_RADIUS_SOURCE}/]`,
          message:
            'Arbitrary rounded-[...] value not derived from var(--radius) or var(--radius-chrome). Use a rounded-sm/md/lg/xl tier, rounded-[inherit], or an arbitrary value built from one of those tokens, so it cannot drift off the design-system radius.',
        },
      ],
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
