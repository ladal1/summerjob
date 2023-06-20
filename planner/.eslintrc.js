module.exports = {
    ...require('@ackee/styleguide-backend-config/eslint'),
    ignorePatterns: ['dist', '.eslintrc.js', 'prettier.config.js', 'knexfile.ts'],
    parserOptions: {
      project: '.eslint.tsconfig.json',
    },
    rules: {
      ...require('@ackee/styleguide-backend-config/eslint').rules,
      'new-cap': 1
    },
  }
  