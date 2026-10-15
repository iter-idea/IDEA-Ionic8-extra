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

Additionaly, if you want to allow only one simultaneous session per account, [implement what is suggested in this document](https://www.notion.so/iter-idea/894fbfce395f4bdeb0a85b3a217bc86b?pvs=4).

Additionaly, if you want to configure OKTA integration, [follow this guide](https://www.notion.so/iter-idea/18445eea580780349282e1120e7c444f?pvs=4).

## New sign-in pages (`IDEAAuthRoutes`)

Modern pages for every flow (sign-in with the email first, new password, MFA, password reset, sign-up, Okta), that an app brands with tokens and settings only: no override of their internals is needed. The pages of `routes` stay exactly as they are, for the apps that don't switch.

To switch, mount `IDEAAuthRoutes` in place of `routes`, on the same path (URLs, guards and links stay the same):

```ts
{
  path: 'auth',
  loadChildren: (): Promise<any> => import('@idea-ionic/auth').then(m => m.IDEAAuthRoutes),
  canActivate: [initGuard]
}
```

Then delete the app's CSS aimed at the old pages (`.authCard`, `.flexBox`, `idea-sign-in`, …): it no longer applies.

### Settings

In `environment.idea.auth`, besides the current ones (`title`, `website`, `hasIntroPage`, `registrationIsPossible`, `passwordPolicy`, …):

- `logo`: `{ light: string; dark?: string }`, the paths of the logo, the dark one shown with the system's dark mode; default `assets/icons/icon-auth.svg` and `assets/icons/icon-auth-alt.svg`.

The header shows the logo, the `title` and the `IDEA_VARIABLES.TAGLINE` term, if any; the footer the terms (`IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL`, `IDEA_VARIABLES.PRIVACY_POLICY_URL`), the link to the intro page (with `hasIntroPage`: "Website", or the `IDEA_VARIABLES.INTRO_LINK` term, e.g. "Discover AIRP") and, with `website`, ITER IDEA's logo after "Made by" (or the `IDEA_VARIABLES.MADE_BY` term): the app's `assets/icons/idea.png` (`idea-alt.png` with the system's dark mode). Without `website`, which only these pages use, no credit.

A page that's always dark (e.g. a dark brand, also with the system's light mode) gives only `logo.light`, in its version for a dark background, and puts the light version of ITER IDEA's logo in both files.

### Tokens

Set where the app sets its theme (light and dark); all optional, they default to the app's Ionic theme.

| Token                               | Default                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--idea-auth-background`            | `var(--ion-background-color)`; any `background`: color, gradient, image                                       |
| `--idea-auth-color`                 | `var(--ion-text-color)`                                                                                       |
| `--idea-auth-color-muted`           | `var(--ion-color-medium)`                                                                                     |
| `--idea-auth-column-width`          | `380px`                                                                                                       |
| `--idea-auth-accent`                | `var(--ion-color-primary)`                                                                                    |
| `--idea-auth-accent-contrast`       | `var(--ion-color-primary-contrast)`                                                                           |
| `--idea-auth-link-color`            | the accent                                                                                                    |
| `--idea-auth-font-family`           | `var(--ion-font-family)`                                                                                      |
| `--idea-auth-title-font-family`     | the font family                                                                                               |
| `--idea-auth-title-font-size`       | `32px`                                                                                                        |
| `--idea-auth-title-font-weight`     | `600`                                                                                                         |
| `--idea-auth-radius`                | `12px`                                                                                                        |
| `--idea-auth-field-radius`          | the radius                                                                                                    |
| `--idea-auth-button-radius`         | the radius                                                                                                    |
| `--idea-auth-field-background`      | `transparent`                                                                                                 |
| `--idea-auth-field-color`           | the color                                                                                                     |
| `--idea-auth-field-border-color`    | the text color at 55% (3:1 on the background, for the fields to be seen)                                      |
| `--idea-auth-field-focus-color`     | the accent                                                                                                    |
| `--idea-auth-field-focus-ring`      | the primary color at 25%                                                                                      |
| `--idea-auth-field-height`          | `48px`                                                                                                        |
| `--idea-auth-button-height`         | `48px`                                                                                                        |
| `--idea-auth-button-font-weight`    | `600`                                                                                                         |
| `--idea-auth-button-text-transform` | `none`                                                                                                        |
| `--idea-auth-danger-color`          | `var(--ion-color-danger)`                                                                                     |
| `--idea-auth-success-color`         | a green readable in light and dark mode (it follows the system's mode: an app without a dark palette sets it) |
| `--idea-auth-notice-background`     | the text color at 6%                                                                                          |
| `--idea-auth-notice-color`          | the color                                                                                                     |
| `--idea-auth-logo-height`           | `40px`                                                                                                        |
| `--idea-auth-tagline-color`         | the muted color                                                                                               |
| `--idea-auth-app-name-color`        | the color                                                                                                     |
| `--idea-auth-app-name-font-weight`  | `700`                                                                                                         |
| `--idea-auth-app-name-font-size`    | `16px`                                                                                                        |
| `--idea-auth-app-name-separator`    | none; a line between the logo and the name, as a border (e.g. `1px solid #6bc3e2`)                            |
| `--idea-auth-header-gap`            | 35% of the logo's height                                                                                      |

```scss
:root {
  --idea-auth-background: var(--app-brand-navy);
  --idea-auth-color: #ffffff;
  --idea-auth-field-background: #ffffff;
  --idea-auth-field-color: var(--app-brand-navy);
}
```

### Where a token isn't enough

The pages' rules have no specificity: an app's plain selector on these classes applies, without `:root` or `!important`. The exceptions are the components that Ionic styles with a class and the apps often by tag: the module's rules are `ion-input.idea-auth-input`, `ion-button.idea-auth-button` and `ion-checkbox.idea-auth-checkbox`, which an app's `ion-input`, `ion-button` or `ion-checkbox` rules don't reach; to restyle one beyond its tokens, use one class more (e.g. `.idea-auth ion-button.idea-auth-button`). The page's background is painted on the `background` part of its `ion-content`, out of reach of an app's `ion-content { --background }`: `.idea-auth::part(background)` restyles it.

`.idea-auth` (the page's `ion-content`), `.idea-auth-header`, `.idea-auth-logo`, `.idea-auth-app-name`, `.idea-auth-tagline`, `.idea-auth-main`, `.idea-auth-column`, `.idea-auth-heading`, `.idea-auth-title`, `.idea-auth-subtitle`, `.idea-auth-form`, `.idea-auth-field`, `.idea-auth-label`, `.idea-auth-input` (the `ion-input`), `.idea-auth-hint`, `.idea-auth-account`, `.idea-auth-notice`, `.idea-auth-requirements`, `.idea-auth-actions`, `.idea-auth-button` (the `ion-button`), `.idea-auth-link`, `.idea-auth-agreements`, `.idea-auth-checkbox` (the `ion-checkbox`), `.idea-auth-footer`.

E.g. `.idea-auth-app-name { display: none; }` when the logo already carries the app's name.
