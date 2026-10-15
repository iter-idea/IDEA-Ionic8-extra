import { Injectable, inject } from '@angular/core';
import { Amplify } from 'aws-amplify';
import {
  AuthSession,
  confirmResetPassword,
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  fetchMFAPreference,
  fetchUserAttributes,
  resendSignUpCode,
  resetPassword,
  setUpTOTP,
  signIn,
  signOut,
  signUp,
  updateMFAPreference,
  updateUserAttributes as updateCognitoUserAttributes,
  verifyTOTPSetup
} from 'aws-amplify/auth';
import { IDEAEnvironment, IDEAStorageService, IDEATranslationsService } from '@idea-ionic/common';

import { COMMON_PASSWORDS_TOP_1000 } from './commonPasswords.model';

/**
 * Cognito wrapper to manage the authentication flow.
 *
 * Note: in IDEA's Cognito users pools, the email is an alias of the username.
 */
@Injectable({ providedIn: 'root' })
export class IDEAAuthService {
  protected _env = inject(IDEAEnvironment);
  protected _translate = inject(IDEATranslationsService);
  protected _storage = inject(IDEAStorageService);

  /**
   * The name of the Cognito's user attribute which contains the key of the last device to login in this project.
   */
  protected deviceKeyAttribute: string;

  /**
   * The user signing in, while the sign-in waits for the answer to a challenge (new password, MFA code).
   */
  challengeUsername: string;

  private newAccountJustRegistered: string;

  private mfaProjectName: string;

  private passwordPolicy: any;

  constructor() {
    this.deviceKeyAttribute = 'custom:'.concat(this._env.idea.project);
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: this._env.aws.cognito.userPoolId,
          userPoolClientId: this._env.aws.cognito.userPoolClientId
        }
      }
    });
    removeUserDataCachedByEarlierVersions(this._env.aws.cognito.userPoolClientId);
    this.mfaProjectName = this._env.idea.auth.title || this._env.idea.project;
    this.passwordPolicy = this._env.idea.auth.passwordPolicy;
  }

  /**
   * Perform a login through username and password.
   */
  async login(username: string, password: string): Promise<LoginOutcomeActions> {
    this.challengeUsername = null;
    // Amplify refuses to sign in over a stored session (e.g. one refused by the post-auth checks): the new sign-in
    // replaces it
    await signOut();
    const { nextStep } = await withErrorCode(signIn({ username, password }));
    switch (nextStep.signInStep) {
      case 'DONE':
        return this._env.idea.auth.forceLoginWithMFA ? LoginOutcomeActions.MFA_SETUP : LoginOutcomeActions.NONE;
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        this.challengeUsername = username;
        return LoginOutcomeActions.NEW_PASSWORD;
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
        this.challengeUsername = username;
        return LoginOutcomeActions.MFA_CHALLENGE;
      // Amplify reports these refusals of Cognito as steps: the apps expect errors, named after the Cognito exception
      case 'CONFIRM_SIGN_UP':
        throw cognitoError('UserNotConfirmedException', 'User is not confirmed.');
      case 'RESET_PASSWORD':
        throw cognitoError('PasswordResetRequiredException', 'Password reset required for the user.');
      default:
        throw cognitoError('UnsupportedSignInStep', 'Sign-in step not supported: '.concat(nextStep.signInStep));
    }
  }
  /**
   * Complete the new password flow in the authentication.
   */
  async confirmNewPassword(newPassword: string): Promise<void> {
    await this.answerSignInChallenge(newPassword);
  }
  /**
   *  Complete the MFA challenge flow in the authentication.
   */
  async completeMFAChallenge(otpCode: string): Promise<void> {
    await this.answerSignInChallenge(otpCode);
  }
  /**
   * Answer the challenge that the sign-in in progress waits for (a wrong answer can be given again).
   * Its session lasts only a few minutes (3, by default): once it's over, the `challengeUsername` is cleared, since only
   * a new sign-in can go on.
   */
  private async answerSignInChallenge(challengeResponse: string): Promise<void> {
    try {
      const { nextStep } = await withErrorCode(confirmSignIn({ challengeResponse }));
      if (nextStep.signInStep !== 'DONE')
        throw cognitoError('UnsupportedSignInStep', 'Sign-in step not supported: '.concat(nextStep.signInStep));
      this.challengeUsername = null;
    } catch (err) {
      const sessionIsOver = ['SignInException', 'NotAuthorizedException'].includes((err as Error)?.name);
      if (sessionIsOver) this.challengeUsername = null;
      throw err;
    }
  }
  /**
   * Register a new user a set its default attributes.
   */
  async register(username: string, password: string, attributes?: any): Promise<void> {
    attributes = attributes || {};
    // add attributes like the email address and the fullname
    const userAttributes: Record<string, string> = {};
    for (const prop in attributes) if (attributes[prop]) userAttributes[prop] = attributes[prop];
    // add the email, which is equal to the username for most of our Pools
    if (!attributes.email) userAttributes.email = username;
    // register the new user to the pool
    await withErrorCode(signUp({ username, password, options: { userAttributes } }));
    this.newAccountJustRegistered = username;
  }
  /**
   * In case a new account has just been registered, return the username.
   */
  getNewAccountJustRegistered(): string {
    return this.newAccountJustRegistered;
  }
  /**
   * Confirm a new registration through the confirmation code sent by Cognito.
   */
  async confirmRegistration(username: string, code: string): Promise<void> {
    await withErrorCode(confirmSignUp({ username, confirmationCode: code, options: { forceAliasCreation: true } }));
  }
  /**
   * Send again a confirmation code for a new registration.
   */
  async resendConfirmationCode(username: string): Promise<void> {
    await withErrorCode(resendSignUpCode({ username }));
  }
  /**
   * Logout the currently signed-in user.
   * With `global`, the other sessions end only if Cognito can be reached; the local one ends anyway.
   */
  async logout(options?: { global: boolean }): Promise<void> {
    options = Object.assign({ global: false }, options);
    // remove the optional auth details (and the copy of the refresh token that the earlier versions saved)
    await this._storage.remove('AuthUserDetails');
    await this._storage.remove('AuthRefreshToken');
    // get the session, refreshed if needed (the global sign-out needs a valid one)
    const { tokens } = await fetchAuthSession().catch((): AuthSession => ({}));
    // if the session is active and a reference to the device was saved, forget it
    if (tokens && this._env.idea.auth.singleSimultaneousSession) await this.setCurrentDeviceForProject(null);
    // sign-out from the pool (terminate the current session or all the sessions); the local session is removed anyway
    await signOut({ global: options.global });
  }
  /**
   * Send a password reset request.
   */
  async forgotPassword(username: string): Promise<void> {
    await withErrorCode(resetPassword({ username }));
  }
  /**
   * Confirm a new password after a password reset request.
   */
  async confirmPassword(username: string, code: string, newPwd: string): Promise<void> {
    await withErrorCode(confirmResetPassword({ username, confirmationCode: code, newPassword: newPwd }));
  }
  /**
   * Gets the URL for enabling MFA. This URL can be used to generate a QR Code to read with an authenticator app.
   */
  async getURLForEnablingMFA(): Promise<string> {
    const { sharedSecret } = await withErrorCode(setUpTOTP());
    return `otpauth://totp/${encodeURI(this.mfaProjectName)}?secret=${sharedSecret}`;
  }
  /**
   * Check whether the user has MFA enabled.
   * Note: the setting is always read from Cognito; `bypassCache` remains only for compatibility.
   */
  async checkIfUserHasMFAEnabled(bypassCache = false): Promise<boolean> {
    const { enabled } = await withErrorCode(fetchMFAPreference());
    return !!enabled?.includes('TOTP');
  }
  /**
   * Configure a MFA device for the user.
   */
  private async setMFADevice(otp: string, mfaDeviceName: string, enabled = true): Promise<void> {
    await withErrorCode(verifyTOTPSetup({ code: otp, options: { friendlyDeviceName: mfaDeviceName } }));
    await withErrorCode(updateMFAPreference({ totp: enabled ? 'PREFERRED' : 'DISABLED' }));
  }
  /**
   * Enable a new MFA device for the user by inserting an OTP code generated by it.
   */
  enableMFA(otp: string, mfaDeviceName = 'default'): Promise<void> {
    return this.setMFADevice(otp, mfaDeviceName, true);
  }
  /**
   * Disable MFA for a user by inserting an OTP code generated by it.
   */
  disableMFA(otp: string, mfaDeviceName = 'default'): Promise<void> {
    return this.setMFADevice(otp, mfaDeviceName, false);
  }
  /**
   * Check if a user is currently authenticated.
   * @param offlineAllowed if set and if offline, skip authentication and retrieve data locally
   * @param getFreshIdTokenOnExp cb function to execute when the idToken is refreshed
   */
  async isAuthenticated(offlineAllowed: boolean, getFreshIdTokenOnExp?: (freshIdToken: string) => void): Promise<any> {
    if (offlineAllowed && !navigator.onLine) {
      // re-execute the method when back online, so that you can retrieve a token to make requests
      window.addEventListener(
        'online',
        (): Promise<void> =>
          this.isAuthenticated(true, getFreshIdTokenOnExp)
            // set the new token as if it was refreshed
            .then(result => getFreshIdTokenOnExp(result.idToken))
      );
      return { idToken: null, userDetails: await this._storage.get('AuthUserDetails') };
    }
    // get the session, refreshed if needed
    const { tokens } = await withErrorCode(fetchAuthSession());
    if (!tokens?.idToken) throw cognitoError('UserUnAuthenticatedException', 'User needs to be authenticated.');
    if (this._env.idea.auth.forceLoginWithMFA && !(await this.checkIfUserHasMFAEnabled()))
      throw new Error(LoginOutcomeActions.MFA_SETUP);
    const userDetails: any = await withErrorCode(fetchUserAttributes());
    // add the user's groups to the attributes
    userDetails['groups'] = tokens.accessToken.payload['cognito:groups'] || [];
    // run some checks considering the user's groups and devices (based on the project's configuration)
    await this.runPostAuthChecks(userDetails);
    // set a timer to manage the autorefresh of the idToken (through the refreshToken)
    setTimeout((): Promise<void> => this.refreshSession(getFreshIdTokenOnExp), 15 * 60 * 1000); // every 15 minutes
    // (async) if offlineAllowed, save data locally, to use it next time we'll be offline
    if (offlineAllowed) this._storage.set('AuthUserDetails', userDetails);
    // return the idToken (to use with API)
    return { idToken: tokens.idToken.toString(), userDetails };
  }
  /**
   * Helper to refresh the session every N minutes.
   */
  private async refreshSession(callback: (freshIdToken: string) => void): Promise<void> {
    const { tokens } = await fetchAuthSession({ forceRefresh: true }).catch((): AuthSession => ({}));
    const freshIdToken = tokens?.idToken?.toString();
    // repeat every 15 minutes; in case of error, try again in 1 minute
    setTimeout((): Promise<void> => this.refreshSession(callback), (freshIdToken ? 15 : 1) * 60 * 1000);
    // run the callback action, if set
    if (freshIdToken && callback) callback(freshIdToken);
  }
  /**
   * Run some post-auth checks, based on the users groups and on the app's configuration:
   *  - users in the Cognito's "admins" grup skip all the following rules.
   *  - users in the Cognito's "robots" group can't sign-into front-ends (they serve only back-end purposes).
   *  - if `env.idea.auth.singleSimultaneousSession` is on, make sure there is only one active session per user.
   */
  private async runPostAuthChecks(userDetails: any): Promise<void> {
    const groups: string[] = userDetails['groups'];
    // skip checks if the user is in the "admins" group
    const isAdmin = groups.some(x => x === 'admins');
    if (isAdmin) return;
    // users in the "robots" group can't sign-into front-ends (they serve only back-end purposes)
    const isRobot = groups.some(x => x === 'robots');
    if (isRobot) throw new Error('ROBOT_USER');
    // in case the project limits each account to only one simultaneous session, run a check
    if (this._env.idea.auth.singleSimultaneousSession) await this.checkForSimultaneousSessions(userDetails);
  }
  /**
   * Check whether the user signed-into multiple devices.
   */
  private async checkForSimultaneousSessions(userDetails: any): Promise<void> {
    // get or create a key for the current device (~random)
    let currentDeviceKey = await this._storage.get('AuthDeviceKey');
    if (!currentDeviceKey) {
      const randomKey = Math.random().toString(36).substring(10);
      currentDeviceKey = randomKey.concat(String(Date.now()));
      await this._storage.set('AuthDeviceKey', currentDeviceKey);
    }
    // check whether the last device to sign-into this project (if any) is the current one
    const lastDeviceToSignIntoThisProject = userDetails[this.deviceKeyAttribute];
    // if it's the first user's device to sign-in, save the reference in Cognito
    if (!lastDeviceToSignIntoThisProject) {
      try {
        await this.setCurrentDeviceForProject(currentDeviceKey);
      } catch (err) {
        throw new Error('CANT_SET_DEVICE');
      }
    }
    // if the device changed, report there is more than one simultaneous session
    else if (lastDeviceToSignIntoThisProject !== currentDeviceKey) throw new Error('SIMULTANEOUS_SESSION');
  }
  /**
   * Set (or reset) the current user's device (by key) in the current project (stored in Cognito).
   */
  private setCurrentDeviceForProject(deviceKey?: string): Promise<void> {
    const attributes: any = {};
    // note: an empty string will remove the attribute from Cognito
    attributes[this.deviceKeyAttribute] = deviceKey || '';
    return this.updateUserAttributes(attributes);
  }
  /**
   * Update the currently logged in user's attributes.
   */
  async updateUserAttributes(attributes: any): Promise<void> {
    // prepare the attributes we want to change
    const userAttributes: Record<string, string> = {};
    for (const prop in attributes) if (attributes[prop] !== undefined) userAttributes[prop] = attributes[prop];
    await withErrorCode(updateCognitoUserAttributes({ userAttributes }));
  }

  /**
   * Validate the password against the policy set in the environments configuration.
   * In case there are errors, they are returned as an array of strings.
   */
  validatePasswordAgainstPolicy(password: string): string[] {
    const errors: string[] = [];
    if (password?.trim().length < this.passwordPolicy.minLength) errors.push('MIN_LENGTH');
    if (this.passwordPolicy.requireDigits && !/\d/.test(password)) errors.push('REQUIRE_DIGITS');
    if (this.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) errors.push('REQUIRE_LOWERCASE');
    if (this.passwordPolicy.requireSymbols && !/[\^\$\*\.\_\~\`\+\=@\!\?\>\<\:\;\\\,\#\%\&]/.test(password))
      errors.push('REQUIRE_SYMBOLS');
    if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) errors.push('REQUIRE_UPPERCASE');
    return errors;
  }
  /**
   * Validate the password against offline and online databases, to avoid common and exploited passwords.
   */
  async validatePasswordAgainstDatabases(password: string, customStringsToAvoid?: string[]): Promise<string[]> {
    const errors: string[] = [];
    let pwd = (password || '').trim().toLowerCase();
    const pwdContains = (str: string): boolean => pwd.includes((str || '').trim().toLowerCase());
    const projectReferencesToAvoid = [
      this._env.idea.project,
      this._env.idea.auth.title,
      this._translate._('COMMON.APP_NAME')
    ];
    if (projectReferencesToAvoid.some(x => pwdContains(x))) errors.push('COMMON_PASSWORD_PROJECT');
    if (customStringsToAvoid && customStringsToAvoid.some(x => pwdContains(x))) errors.push('COMMON_PASSWORD_CUSTOM');
    if (COMMON_PASSWORDS_TOP_1000.some(x => pwdContains(x))) errors.push('COMMON_PASSWORD_INTERNAL');
    if (errors.length === 0) {
      const pwdSHA1 = await SHA1(password);
      if (pwdSHA1) {
        const res = await fetch('https://api.pwnedpasswords.com/range/'.concat(pwdSHA1.slice(0, 5)));
        if (res.status === 200) {
          const pwnedPasswordsRawSuffixes = await res.text();
          if (pwnedPasswordsRawSuffixes.includes(pwdSHA1.slice(5))) errors.push('COMMON_PASSWORD_EXTERNAL');
        }
      }
    }
    return errors;
  }
  /**
   * Get a complete password policy pattern, based on the environments configuration, to use on password input fields.
   * Note: some of the symbols couldn't be included because unsupported by the input[pattern] attribute.
   */
  getPasswordPolicyPatternForInput(): string {
    let pattern = '';
    if (this.passwordPolicy.requireDigits) pattern += `(?=.*[0-9])`;
    if (this.passwordPolicy.requireLowercase) pattern += `(?=.*[a-z])`;
    if (this.passwordPolicy.requireSymbols) pattern += `(?=.*[\^\$\*\.\_\~\`\+\=@\!\?\>\<\:\;\\\,\#\%\&])`;
    if (this.passwordPolicy.requireUppercase) pattern += `(?=.*[A-Z])`;
    pattern += `.{${this.passwordPolicy.minLength},}`;
    return pattern;
  }
}

/**
 * The possible actions following a successful login.
 */
export enum LoginOutcomeActions {
  NONE = 'none',
  NEW_PASSWORD = 'newPassword',
  MFA_CHALLENGE = 'mfaChallenge',
  MFA_SETUP = 'mfaSetup'
}

/**
 * Get the SHA1 hex uppercase hash of a string, using web crypto.
 */
const SHA1 = async (str: string): Promise<string | null> => {
  if (!window.crypto) return null;
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
};

/**
 * Amplify names its errors after Cognito's exceptions: the name is also set as `code`, which the apps read (e.g. to
 * tell a Cognito out of reach, `NetworkError`, from refused credentials).
 */
const withErrorCode = async <T>(request: Promise<T>): Promise<T> => {
  try {
    return await request;
  } catch (err) {
    if (err instanceof Error && !(err as any).code) (err as any).code = err.name;
    throw err;
  }
};

/**
 * An error shaped like Cognito's, for what Amplify doesn't report as an error.
 */
const cognitoError = (name: string, message: string): Error => Object.assign(new Error(message), { name, code: name });

/**
 * Remove the user's data that the earlier versions (on `amazon-cognito-identity-js`) cached next to the session's
 * tokens: Amplify never reads nor clears it. It runs at start-up, while the key of the last user still points to it.
 */
const removeUserDataCachedByEarlierVersions = (userPoolClientId: string): void => {
  const keyPrefix = 'CognitoIdentityServiceProvider.'.concat(userPoolClientId);
  const lastAuthUser = localStorage.getItem(keyPrefix.concat('.LastAuthUser'));
  if (lastAuthUser) localStorage.removeItem([keyPrefix, lastAuthUser, 'userData'].join('.'));
};
