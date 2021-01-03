module.exports = {
  overrides: [
    {
      files: ['*.ts'],
      env: {
        browser: true,
        es6: true,
        node: true
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module'
      },
      plugins: [
        '@angular-eslint/eslint-plugin',
        '@typescript-eslint',
        'eslint-plugin-import',
        'eslint-plugin-jsdoc',
        'eslint-plugin-prefer-arrow'
      ],
      rules: {
        '@angular-eslint/component-class-suffix': [
          'error',
          {
            suffixes: ['Page', 'Component']
          }
        ],
        '@angular-eslint/no-host-metadata-property': 'error',
        '@angular-eslint/no-inputs-metadata-property': 'error',
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': [
          'error',
          {
            types: {
              Object: {
                message: 'Avoid using the `Object` type. Did you mean `object`?'
              },
              Function: {
                message: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.'
              },
              Boolean: {
                message: 'Avoid using the `Boolean` type. Did you mean `boolean`?'
              },
              Number: {
                message: 'Avoid using the `Number` type. Did you mean `number`?'
              },
              String: {
                message: 'Avoid using the `String` type. Did you mean `string`?'
              },
              Symbol: {
                message: 'Avoid using the `Symbol` type. Did you mean `symbol`?'
              }
            }
          }
        ],
        '@typescript-eslint/consistent-type-assertions': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/dot-notation': 'off',
        '@typescript-eslint/member-delimiter-style': [
          'error',
          {
            multiline: { delimiter: 'semi', requireLast: true },
            singleline: { delimiter: 'semi', requireLast: false }
          }
        ],
        '@typescript-eslint/member-ordering': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true }],
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],
        '@typescript-eslint/semi': ['error', 'always', { omitLastInOneLineBlock: true }],
        '@typescript-eslint/triple-slash-reference': [
          'error',
          { path: 'always', types: 'prefer-import', lib: 'always' }
        ],
        '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/unified-signatures': 'error',
        'arrow-body-style': 'error',
        'arrow-parens': ['off', 'always'],
        'brace-style': ['error', '1tbs'],
        'comma-dangle': ['error', 'never'],
        complexity: 'off',
        'constructor-super': 'error',
        curly: 'off',
        'eol-last': 'error',
        eqeqeq: ['error', 'always'],
        'guard-for-in': 'error',
        'max-classes-per-file': 'off',
        'max-len': ['error', { code: 120, tabWidth: 2 }],
        'new-parens': 'off',
        'newline-per-chained-call': 'off',
        'no-bitwise': 'off',
        'no-caller': 'error',
        'no-case-declarations': 'off',
        'no-cond-assign': 'error',
        'no-console': ['error', { allow: ['log'] }],
        'no-debugger': 'warn',
        'no-empty': 'error',
        'no-eval': 'error',
        'no-extra-semi': 'error',
        'no-fallthrough': 'error',
        'no-invalid-this': 'error',
        'no-irregular-whitespace': 'error',
        'no-multiple-empty-lines': 'error',
        'no-new-wrappers': 'error',
        'no-restricted-imports': ['error', 'rxjs/Rx'],
        'no-shadow': 'off',
        'no-throw-literal': 'error',
        'no-trailing-spaces': 'error',
        'no-undef-init': 'error',
        'no-underscore-dangle': 'off',
        'no-unsafe-finally': 'error',
        'no-unused-labels': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'one-var': 'off',
        'prefer-const': 'error',
        'quote-props': ['error', 'as-needed'],
        radix: 'error',
        'space-before-function-paren': ['error', 'never'],
        'space-in-parens': ['error', 'never'],
        'spaced-comment': ['error', 'always', { markers: ['/'] }],
        'use-isnan': 'error',
        'valid-typeof': 'error'
      }
    },
    {
      files: ['*.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
      rules: {}
    }
  ]
};
