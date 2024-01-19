module.exports = {
  root: true,
  ignorePatterns: ['projects/**/*'],
  overrides: [
    {
      files: ['*.ts'],
      env: {
        browser: true,
        es6: true,
        node: true
      },
      parserOptions: {
        project: ['tsconfig.json'],
        sourceType: 'module'
      },
      extends: ['plugin:@angular-eslint/recommended', 'plugin:@angular-eslint/template/process-inline-templates'],
      rules: {
        '@angular-eslint/component-selector': ['error', { type: 'element', style: 'kebab-case' }],
        '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Page', 'Component'] }],
        '@angular-eslint/directive-selector': ['error', { type: 'attribute', style: 'camelCase' }],
        '@angular-eslint/no-output-native': 0
      }
    },
    {
      files: ['*.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
      rules: {}
    }
  ]
};
