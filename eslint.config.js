const { defineConfig, globalIgnores } = require('eslint/config');
const globals = require('globals');
const angular = require('angular-eslint');

module.exports = defineConfig([
  globalIgnores(['projects/**/*', 'dist/**/*']),
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      sourceType: 'module',
      parserOptions: { project: ['tsconfig.json'] }
    },
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      // prefix: [] keeps the pre-v21 behavior (no enforced selector prefix); @angular-eslint v21+
      // defaults prefix to 'app', which this library (idea-*, app-tooltip, legacy page selectors) does not use.
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: [], style: 'kebab-case' }],
      '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Page', 'Component'] }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: [], style: 'camelCase' }],
      '@angular-eslint/no-output-native': 0,
      // Off until the dedicated signals + OnPush/zoneless migration: Angular 22's `ng update` stamped
      // ChangeDetectionStrategy.Eager on existing components to preserve behavior; v22's recommended config
      // adds this rule, which would flag every one of them. Re-enable when components move to OnPush.
      '@angular-eslint/prefer-on-push-component-change-detection': 'off'
    }
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended]
  }
]);
