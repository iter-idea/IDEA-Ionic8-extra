# IDEA Ionic extra ≫ Teams

Components and services used related to teams according to IDEA's standard.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/teams).

## To install

```
npm i --save @idea-ionic/teams
```

_Be sure to install all the requested peer dependencies._

To make sure the translations are loaded into the project:

- add a reference to this module in the environment variable `idea.ionicExtraModules` (see `environment.ts`);
- copy the `i18n/teams` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

Make sure that there is a path (tsconfig file) pointing to `@env` which contains the environment files (Angular standard).
Finally, add in the environments desired the variables you find in the `environment.ts` file of this module.
