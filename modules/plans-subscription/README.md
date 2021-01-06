# IDEA Ionic extra ≫ Plans subscription (and limits)

Subscription to product plans through the mobile devices capabilities (or Stripe, for web).

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/plans-subscription).

## To install

```
npm i --save @idea-ionic/plans-subscription
```

_Be sure to install all the requested peer dependencies._

To make sure the translations are loaded into the project:

- in the project's `assets/configs/idea-config.js` file, add the string `'plans-subscription'` to the array `window.IDEA_IONIC_MODULES`;
- copy the `i18n/plans-subscription` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

**Install Stripe (@todo)**

Finally, add the according configuration (if needed) in the `assets/configs/idea-config.js`:

```
window.STRIPE_PUBLIC_KEY: string;

window.IDEA_AUTH_WEBSITE: string;
window.IDEA_PROJECT: string;
```

## Components

- Subscriptions and Plans
- Limits

## Services

-
