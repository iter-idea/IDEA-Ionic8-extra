# IDEA Ionic extra ≫ Auth

Authentication flow to IDEA's Cognito users pools.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/auth).

## To Install

```
npm i --save @idea-ionic/auth
```

_Be sure to install all the requested peer dependencies._

To make sure the translations are loaded into the project:

- in the project's `assets/configs/idea-config.js` file, add the string `'auth'` to the array `window.IDEA_IONIC_MODULES`;
- copy the `i18n/auth` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

Finally, add the according configuration (if needed) in the `assets/configs/idea-config.js`:

```
window.IDEA_AWS_COGNITO_USER_POOL_ID: string;
window.IDEA_AWS_COGNITO_WEB_CLIENT_ID: string;
window.IDEA_APP_TITLE: string;
window.IDEA_AUTH_WEBSITE: string;
window.IDEA_AUTH_REGISTRATION_POSSIBLE: boolean;
window.IDEA_HAS_INTRO_PAGE: boolean;
```

## Components

- Auth flow (sign in, sign up, etc.).

## Services

- Auth
