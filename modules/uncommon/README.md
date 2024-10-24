# IDEA Ionic extra ≫ Uncommon

Components and services previously part of the `common` module, that are not used anymore in newer projects, but they should be kept for backwards compatibility.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/uncommon).

## To install

```
npm i --save @idea-ionic/uncommon
```

_Be sure to install all the requested peer dependencies._

To make sure the translations are loaded into the project:

- add a reference to this module in the environment variable `idea.ionicExtraModules` (see `environment.ts`);
- copy the `i18n/uncommon` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

Make sure that there is a path (tsconfig file) pointing to `@env` which contains the environment files (Angular standard).
Finally, add in the environments desired the variables you find in the `environment.ts` file of this module.
