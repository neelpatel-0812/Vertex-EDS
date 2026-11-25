// Same base rules as aem-boilerplate-commerce, so the files this package copies into a
// storefront pass that storefront's own lint.
module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
    es2022: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }],
    'import/prefer-default-export': 'off',
    'import/no-unresolved': ['error', { ignore: ['^@dropins/'] }],
    'linebreak-style': ['error', 'unix'],
    'no-param-reassign': [2, { props: false }],
    'no-use-before-define': [2, { functions: false }],
    'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],
  },
  overrides: [
    {
      // Installer and tests run in Node, not the browser.
      files: ['scripts/**/*.js', 'test/**/*.js', '.eslintrc.cjs'],
      env: { node: true, browser: false },
      parserOptions: { sourceType: 'script' },
      rules: {
        'no-console': 'off',
        strict: 'off',
        'import/extensions': ['error', { js: 'always', json: 'always' }],
      },
    },
    {
      // Copied into the host storefront: imports resolve against the host, not this repo.
      files: ['assets/**/*.js'],
      rules: {
        'import/no-unresolved': 'off',
      },
    },
  ],
};
