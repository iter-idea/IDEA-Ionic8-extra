# IDEA Ionic extra ≫ Plans subscription (and limits)

Subscription to product plans through the mobile devices capabilities (or Stripe, for web).

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/plans-subscription).

## To install

```
npm i --save @idea-ionic/plans-subscription
```

_Be sure to install all the requested peer dependencies._

To make sure the translations are loaded into the project:

- add a reference to this module in the environment variable `idea.ionicExtraModules` (see `environment.ts`);
- copy the `i18n/plans-subscription` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

**Install Stripe (@todo)**

Make sure that there is a path (tsconfig file) pointing to `@env` which contains the environment files (Angular standard).
Finally, add in the environments desired the variables you find in the `environment.ts` file of this module.

## Components

- Subscriptions and Plans
- Limits

## Services

-
