// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*'],
    rules: {
      // Code quality rules
      'max-lines': ['error', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],
      'complexity': ['warn', { max: 20 }],

      // Unused variables - error for production code
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // Console logging - warn, allow warn/error only
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Import ordering
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        alphabetize: { order: 'asc' },
        'newlines-between': 'never',
      }],

      // Consistent return statements
      'consistent-return': 'error',

      // No var usage
      'no-var': 'error',

      // Prefer const
      'prefer-const': 'error',
    },
    overrides: [
      {
        files: ['*.test.js', '*.test.ts', '*.test.tsx', '*.stories.js', '*.stories.tsx'],
        rules: {
          'max-lines': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
        }
      },
      {
        files: ['*.config.js', '*.config.ts'],
        rules: {
          '@typescript-eslint/no-unused-vars': 'off',
        }
      }
    ]
  },
]);
