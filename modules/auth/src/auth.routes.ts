import { Routes } from '@angular/router';

import { IDEASignInPage } from './signIn.page';
import { IDEASignUpPage } from './signUp.page';
import { IDEANewPasswordPage } from './newPassword.page';
import { IDEAResendLinkPage } from './resendLink.page';
import { IDEAForgotPasswordPage } from './forgotPassword.page';
import { IDEAConfirmPasswordPage } from './confirmPassword.page';
import { IDEAMFAChallengePage } from './mfaChallenge.page';
import { IDEASetupMFAPage } from './setupMFA.page';

export const routes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  { path: 'sign-in', component: IDEASignInPage },
  { path: 'sign-up', component: IDEASignUpPage },
  { path: 'new-password', component: IDEANewPasswordPage },
  { path: 'mfa-challenge', component: IDEAMFAChallengePage },
  { path: 'setup-mfa', component: IDEASetupMFAPage },
  { path: 'resend-link', component: IDEAResendLinkPage },
  { path: 'forgot-password', component: IDEAForgotPasswordPage },
  { path: 'confirm-password', component: IDEAConfirmPasswordPage }
];
