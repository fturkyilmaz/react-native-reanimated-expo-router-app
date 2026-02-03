// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      'max-lines': ['error', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
    overrides: [
      {
        files: ['*.test.js', '*.stories.js'],
        rules: {
          'max-lines': 'off'
        }
      }
    ]
  },
]);
