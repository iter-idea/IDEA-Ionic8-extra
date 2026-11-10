import { Routes } from '@angular/router';

import { IDEAAuthSignInPage } from './authSignIn.page';
import { IDEAAuthSignUpPage } from './authSignUp.page';
import { IDEAAuthNewPasswordPage } from './authNewPassword.page';
import { IDEAAuthMFAChallengePage } from './authMFAChallenge.page';
import { IDEAAuthSetupMFAPage } from './authSetupMFA.page';
import { IDEAAuthResendLinkPage } from './authResendLink.page';
import { IDEAAuthForgotPasswordPage } from './authForgotPassword.page';
import { IDEAAuthConfirmPasswordPage } from './authConfirmPassword.page';
import { IDEAAuthSSOPage } from './authSSO.page';

/**
 * The sign-in pages, brandable with tokens and settings (see the module's README). They take the place of `routes`,
 * on the same paths: the app mounts them on `auth`.
 */
export const IDEAAuthRoutes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  { path: 'sign-in', component: IDEAAuthSignInPage },
  { path: 'sign-up', component: IDEAAuthSignUpPage },
  { path: 'new-password', component: IDEAAuthNewPasswordPage },
  { path: 'mfa-challenge', component: IDEAAuthMFAChallengePage },
  { path: 'setup-mfa', component: IDEAAuthSetupMFAPage },
  { path: 'resend-link', component: IDEAAuthResendLinkPage },
  { path: 'forgot-password', component: IDEAAuthForgotPasswordPage },
  { path: 'confirm-password', component: IDEAAuthConfirmPasswordPage },
  { path: 'sso', component: IDEAAuthSSOPage },
  // deprecated: for the links already handed out (e.g. an app's icon in Okta's portal) and the providers with a `type`
  { path: 'okta', component: IDEAAuthSSOPage }
];
