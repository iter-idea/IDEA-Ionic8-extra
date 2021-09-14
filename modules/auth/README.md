# IDEA Ionic extra ≫ Auth

Authentication flow to IDEA's Cognito users pools.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/auth).

## To Install

```
npm i --save @idea-ionic/auth
```

_Be sure to install all the requested peer dependencies._

To make sure the translations are loaded into the project:

- add a reference to this module in the environment variable `idea.ionicExtraModules` (see `environment.ts`);
- copy the `i18n/auth` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

Make sure that there is a path (tsconfig file) pointing to `@env` which contains the environment files (Angular standard).
Finally, add in the environments desired the variables you find in the `environment.ts` file of this module.

Additionaly, if you want to allow only one simultaneous session per account, [implement what is suggested in this document](https://iterinformatica.atlassian.net/wiki/spaces/idea/pages/2739798099/Allow+only+simultaneous+session+per+account+idea-ionic+auth).

## Components

- Auth flow (sign in, sign up, etc.).

## Services

- Auth
