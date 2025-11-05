module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Test additions or corrections
        'build', // Build system changes
        'ci', // CI configuration changes
        'chore', // Maintenance tasks
        'revert', // Revert previous commit
      ],
    ],
    'subject-min-length': [2, 'always', 10],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
  },
}
