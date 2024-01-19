import { Injectable, inject } from '@angular/core';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoRefreshToken,
  CognitoUserSession,
  ISignUpResult,
  ChallengeName
} from 'amazon-cognito-identity-js';
import { IDEAStorageService } from '@idea-ionic/common';
import { IDEAEnvironmentConfig } from 'environment';

/**
 * Cognito wrapper to manage the authentication flow.
 *
 * Note: in IDEA's Cognito users pools, the email is an alias of the username.
 */
@Injectable({ providedIn: 'root' })
export class IDEAAuthService {
  protected env = inject(IDEAEnvironmentConfig);

  /**
   * The name of the Cognito's user attribute which contains the key of the last device to login in this project.
   */
  protected deviceKeyAttribute: string;

  private userPool: CognitoUserPool;

  challengeUsername: string;
  private challengePassword: string;

  private newAccountJustRegistered: string;

  private mfaProjectName: string;

  private passwordPolicy: any;

  constructor(private storage: IDEAStorageService) {
    this.deviceKeyAttribute = 'custom:'.concat(this.env.idea.project);
    this.userPool = new CognitoUserPool({
      UserPoolId: this.env.aws.cognito.userPoolId,
      ClientId: this.env.aws.cognito.userPoolClientId
    });
    this.mfaProjectName = this.env.idea.auth.title ?? this.env.idea.project;
    this.passwordPolicy = this.env.idea.auth.passwordPolicy;
  }

  /**
   * Prepare the necessary structure to get authorized in Cognito.
   */
  private prepareAuthDetails(username: string, pwd: string): AuthenticationDetails {
    return new AuthenticationDetails({ Username: username, Password: pwd });
  }
  /**
   * Prepare the necessary structure to identify a Cognito user.
   */
  prepareCognitoUser(username: string): CognitoUser {
    return new CognitoUser({ Username: username, Pool: this.userPool });
  }
  /**
   * Prepare a user attribute (they are all strings) in Cognito's format.
   */
  private prepareUserAttribute(name: string, value: string): CognitoUserAttribute {
    return new CognitoUserAttribute({ Name: name, Value: value });
  }

  /**
   * Perform a login through username and password.
   */
  login(username: string, password: string): Promise<LoginOutcomeActions> {
    return new Promise((resolve, reject): void => {
      const user = this.prepareCognitoUser(username);
      user.authenticateUser(this.prepareAuthDetails(username, password), {
        onSuccess: (): void =>
          resolve(this.env.idea.auth.forceLoginWithMFA ? LoginOutcomeActions.MFA_SETUP : LoginOutcomeActions.NONE),
        onFailure: (err: Error): void => reject(err),
        newPasswordRequired: (): void => {
          this.challengeUsername = username;
          this.challengePassword = password;
          resolve(LoginOutcomeActions.NEW_PASSWORD);
        },
        totpRequired: (): void => {
          this.challengeUsername = username;
          this.challengePassword = password;
          resolve(LoginOutcomeActions.MFA_CHALLENGE);
        }
      });
    });
  }
  /**
   * Complete the new password flow in the authentication.
   */
  confirmNewPassword(newPassword: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      const user = this.prepareCognitoUser(this.challengeUsername);
      user.authenticateUser(this.prepareAuthDetails(this.challengeUsername, this.challengePassword), {
        onSuccess: (): void => resolve(),
        onFailure: (err: Error): void => reject(err),
        newPasswordRequired: (): void =>
          user.completeNewPasswordChallenge(
            newPassword,
            {},
            {
              onSuccess: (): void => {
                this.challengeUsername = null;
                this.challengePassword = null;
                resolve();
              },
              onFailure: (err: Error): void => reject(err)
            }
          )
      });
    });
  }
  /**
   *  Complete the MFA challenge flow in the authentication.
   */
  completeMFAChallenge(otpCode: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      const user = this.prepareCognitoUser(this.challengeUsername);
      user.authenticateUser(this.prepareAuthDetails(this.challengeUsername, this.challengePassword), {
        onSuccess: (): void => resolve(),
        onFailure: (err: Error): void => reject(err),
        totpRequired: (challengeName: ChallengeName): void =>
          user.sendMFACode(
            otpCode,
            {
              onSuccess: (): void => {
                this.challengeUsername = null;
                this.challengePassword = null;
                resolve();
              },
              onFailure: err => reject(err)
            },
            challengeName
          )
      });
    });
  }
  /**
   * Register a new user a set its default attributes.
   */
  register(username: string, password: string, attributes?: any): Promise<CognitoUser> {
    attributes = attributes || {};
    return new Promise((resolve, reject): void => {
      // add attributes like the email address and the fullname
      const attrs = [];
      for (const prop in attributes)
        if (attributes[prop]) attrs.push(this.prepareUserAttribute(prop, attributes[prop]));
      // add the email, which is equal to the username for most of our Pools
      if (!attributes.email) attrs.push(this.prepareUserAttribute('email', username));
      // register the new user to the pool
      this.userPool.signUp(username, password, attrs, null, (err: Error, res: ISignUpResult): void => {
        if (err) return reject(err);
        this.newAccountJustRegistered = username;
        resolve(res.user);
      });
    });
  }
  /**
   * In case  new account has just been registered, return the username.
   */
  getNewAccountJustRegistered(): string {
    return this.newAccountJustRegistered;
  }
  /**
   * Confirm a new registration through the confirmation code sent by Cognito.
   */
  confirmRegistration(username: string, code: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      this.prepareCognitoUser(username).confirmRegistration(code, true, (err: Error): void =>
        err ? reject(err) : resolve()
      );
    });
  }
  /**
   * Send again a confirmation code for a new registration.
   */
  resendConfirmationCode(username: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      this.prepareCognitoUser(username).resendConfirmationCode((err: Error): void => (err ? reject(err) : resolve()));
    });
  }
  /**
   * Logout the currently signed-in user.
   */
  logout(options?: { global: boolean }): Promise<void> {
    options = Object.assign({ global: false }, options);
    return new Promise((resolve, reject): void => {
      // remove the refresh token previosly saved
      this.storage.remove('AuthRefreshToken').then(
        (): Promise<void> =>
          // remove the optional auth details
          this.storage.remove('AuthUserDetails').then((): void => {
            // get the user and the session
            const user = this.userPool.getCurrentUser();
            user.getSession(async (err: Error): Promise<void> => {
              // if the session is active, run the online sign-out; otherwise, only the local data has been deleted
              if (err) return resolve();
              // if a reference to the device was saved, forget it
              if (this.env.idea.auth.singleSimultaneousSession) await this.setCurrentDeviceForProject(null);
              // sign-out from the pool (terminate the current session or all the sessions)
              if (options.global)
                user.globalSignOut({ onSuccess: (): void => resolve(), onFailure: err => reject(err) });
              else {
                user.signOut();
                resolve();
              }
            });
          })
      );
    });
  }
  /**
   * Send a password reset request.
   */
  forgotPassword(username: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      this.prepareCognitoUser(username).forgotPassword({
        onSuccess: (): void => resolve(),
        onFailure: (err: Error): void => reject(err)
      });
    });
  }
  /**
   * Confirm a new password after a password reset request.
   */
  confirmPassword(username: string, code: string, newPwd: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      this.prepareCognitoUser(username).confirmPassword(code, newPwd, {
        onSuccess: (): void => resolve(),
        onFailure: (err: Error): void => reject(err)
      });
    });
  }
  /**
   * Gets the URL for enabling MFA. This URL can be used to generate a QR Code to read with an authenticator app.
   */
  getURLForEnablingMFA(): Promise<string> {
    return new Promise((resolve, reject): void => {
      const user = this.userPool.getCurrentUser();
      if (!user) return reject();
      user.getSession((err: Error): void => {
        if (err) return reject(err);
        user.associateSoftwareToken({
          associateSecretCode: (secretCode: string): void =>
            resolve(`otpauth://totp/${encodeURI(this.mfaProjectName)}?secret=${secretCode}`),
          onFailure: (err: any): void => reject(err)
        });
      });
    });
  }
  /**
   * Check whether the user has MFA enabled.
   */
  checkIfUserHasMFAEnabled(bypassCache = false): Promise<boolean> {
    return new Promise((resolve, reject): void => {
      const user = this.userPool.getCurrentUser();
      if (!user) return reject();
      user.getSession((err: Error): void => {
        if (err) return reject(err);
        user.getUserData(
          (err, data): void => {
            if (err) return reject(err);
            const isMFAEnabled = !!(data.UserMFASettingList && data.UserMFASettingList.includes('SOFTWARE_TOKEN_MFA'));
            resolve(isMFAEnabled);
          },
          { bypassCache }
        );
      });
    });
  }
  /**
   * Configure a MFA device for the user.
   */
  private setMFADevice(otp: string, mfaDeviceName: string, enabled = true, preferred = true): Promise<void> {
    return new Promise((resolve, reject): void => {
      const user = this.userPool.getCurrentUser();
      if (!user) return reject();
      user.getSession((err: Error): void => {
        if (err) return reject(err);
        user.verifySoftwareToken(otp, mfaDeviceName, {
          onSuccess: (): void =>
            user.setUserMfaPreference(null, { Enabled: enabled, PreferredMfa: preferred }, (err: Error): void =>
              err ? reject(err) : resolve()
            ),
          onFailure: (err): void => reject(err)
        });
      });
    });
  }
  /**
   * Enable a new MFA device for the user by inserting an OTP code generated by it.
   */
  enableMFA(otp: string, mfaDeviceName = 'default'): Promise<void> {
    return this.setMFADevice(otp, mfaDeviceName, true, true);
  }
  /**
   * Disable MFA for a user by inserting an OTP code generated by it.
   */
  disableMFA(otp: string, mfaDeviceName = 'default'): Promise<void> {
    return this.setMFADevice(otp, mfaDeviceName, false, false);
  }
  /**
   * Check if a user is currently authenticated.
   * @param offlineAllowed if set and if offline, skip authentication and retrieve data locally
   * @param getFreshIdTokenOnExp cb function to execute when the idToken is refreshed
   */
  isAuthenticated(offlineAllowed: boolean, getFreshIdTokenOnExp?: (freshIdToken: string) => void): Promise<any> {
    return new Promise((resolve, reject): void => {
      if (offlineAllowed && !navigator.onLine) {
        this.storage.get('AuthUserDetails').then(userDetails => resolve({ idToken: null, userDetails }));
        // re-execute the method when back online, so that you can retrieve a token to make requests
        window.addEventListener(
          'online',
          (): Promise<void> =>
            this.isAuthenticated(true, getFreshIdTokenOnExp)
              // set the new token as if it was refreshed
              .then(result => getFreshIdTokenOnExp(result.idToken))
        );
      } else {
        const user = this.userPool.getCurrentUser();
        if (!user) return reject();
        user.getSession((err: Error, session: CognitoUserSession): void => {
          if (err) return reject(err);
          user.getUserData(
            (err, data): void => {
              if (err) return reject(err);
              const isMFAEnabled = !!(
                data.UserMFASettingList && data.UserMFASettingList.includes('SOFTWARE_TOKEN_MFA')
              );
              if (!isMFAEnabled && this.env.idea.auth.forceLoginWithMFA)
                return reject(new Error(LoginOutcomeActions.MFA_SETUP));
              user.getUserAttributes((e: Error, attributes: CognitoUserAttribute[]): void => {
                if (e) return reject(e);
                // remap user attributes
                const userDetails: any = {};
                attributes.forEach((a: CognitoUserAttribute): string => (userDetails[a.getName()] = a.getValue()));
                // add the user's groups to the attributes
                const sessionInfo = session.getAccessToken().decodePayload();
                const groups: string[] = sessionInfo['cognito:groups'] || [];
                userDetails['groups'] = groups;
                // run some checks considering the user's groups and devices (based on the project's configuration)
                this.runPostAuthChecks(userDetails, err => {
                  // in case some check failed, reject the authorisation flow
                  if (err) return reject(err);
                  // (async) save the refresh token so it can be accessed by other procedures
                  this.storage.set('AuthRefreshToken', session.getRefreshToken().getToken());
                  // set a timer to manage the autorefresh of the idToken (through the refreshToken)
                  setTimeout(
                    (): void => this.refreshSession(user, session.getRefreshToken().getToken(), getFreshIdTokenOnExp),
                    15 * 60 * 1000
                  ); // every 15 minutes
                  // (async) if offlineAllowed, save data locally, to use it next time we'll be offline
                  if (offlineAllowed) this.storage.set('AuthUserDetails', userDetails);
                  // return the idToken (to use with API)
                  resolve({ idToken: session.getIdToken().getJwtToken(), userDetails });
                });
              });
            },
            { bypassCache: true }
          );
        });
      }
    });
  }
  /**
   * Helper to refresh the session every N minutes.
   */
  private refreshSession(user: CognitoUser, refreshToken: string, callback: (freshIdToken: string) => void): void {
    user.refreshSession(
      new CognitoRefreshToken({ RefreshToken: refreshToken }),
      (err: Error, session: CognitoUserSession): void => {
        if (err) {
          // try again in 1 minute
          setTimeout((): void => this.refreshSession(user, refreshToken, callback), 1 * 60 * 1000);
        } else {
          // (async) save the refresh token so it can be accessed by other procedures
          this.storage.set('AuthRefreshToken', session.getRefreshToken().getToken());
          // repeat every 15 minutes
          setTimeout(
            (): void => this.refreshSession(user, session.getRefreshToken().getToken(), callback),
            15 * 60 * 1000
          );
          // run the callback action, if set
          if (callback) callback(session.getIdToken().getJwtToken());
        }
      }
    );
  }
  /**
   * Run some post-auth checks, based on the users groups and on the app's configuration:
   *  - users in the Cognito's "admins" grup skip all the following rules.
   *  - users in the Cognito's "robots" group can't sign-into front-ends (they serve only back-end purposes).
   *  - if `env.idea.auth.singleSimultaneousSession` is on, make sure there is only one active session per user.
   */
  private runPostAuthChecks(userDetails: any, callback: (err?: Error) => void): void | Promise<void> {
    const groups: string[] = userDetails['groups'];
    // skip checks if the user is in the "admins" group
    const isAdmin = groups.some(x => x === 'admins');
    if (isAdmin) return callback();
    // users in the "robots" group can't sign-into front-ends (they serve only back-end purposes)
    const isRobot = groups.some(x => x === 'robots');
    if (isRobot) return callback(new Error('ROBOT_USER'));
    // in case the project limits each account to only one simultaneous session, run a check
    if (this.env.idea.auth.singleSimultaneousSession) return this.checkForSimultaneousSessions(userDetails, callback);
    // otherwise, we're done
    callback();
  }
  /**
   * Check whether the user signed-into multiple devices.
   */
  private async checkForSimultaneousSessions(userDetails: any, callback: (err?: Error) => void): Promise<void> {
    // get or create a key for the current device (~random)
    let currentDeviceKey = await this.storage.get('AuthDeviceKey');
    if (!currentDeviceKey) {
      const randomKey = Math.random().toString(36).substring(10);
      currentDeviceKey = randomKey.concat(String(Date.now()));
      await this.storage.set('AuthDeviceKey', currentDeviceKey);
    }
    // check whether the last device to sign-into this project (if any) is the current one
    const lastDeviceToSignIntoThisProject = userDetails[this.deviceKeyAttribute];
    // if it's the first user's device to sign-in, save the reference in Cognito and resolve
    if (!lastDeviceToSignIntoThisProject) {
      this.setCurrentDeviceForProject(currentDeviceKey)
        .then((): void => callback())
        .catch((): void => callback(new Error('CANT_SET_DEVICE')));
      // if the device didn't change, resolve
    } else if (lastDeviceToSignIntoThisProject === currentDeviceKey) callback();
    // othwerwise, report there is more than one simultaneous session
    else callback(new Error('SIMULTANEOUS_SESSION'));
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
  updateUserAttributes(attributes: any): Promise<void> {
    return new Promise((resolve, reject): void => {
      // prepare the attributes we want to change
      const attrs = new Array<any>();
      for (const prop in attributes)
        if (attributes[prop] !== undefined) attrs.push(this.prepareUserAttribute(prop, attributes[prop]));
      const user = this.userPool.getCurrentUser();
      if (!user) return reject();
      // we need to get the session before to make changes
      user.getSession((err: Error): void => {
        if (err) reject(err);
        else user.updateAttributes(attrs, (e: Error): void => (e ? reject(e) : resolve()));
      });
    });
  }

  /**
   * Validate the password against the policy set in the environments configuration.
   * In case there are errors, they are returned as an array of strings.
   */
  validatePasswordAgainstPolicy(password: string): string[] {
    const errors = [];
    if (password?.trim().length < this.passwordPolicy.minLength) errors.push('MIN_LENGTH');
    if (this.passwordPolicy.requireDigits && !/\d/.test(password)) errors.push('REQUIRE_DIGITS');
    if (this.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) errors.push('REQUIRE_LOWERCASE');
    if (this.passwordPolicy.requireSymbols && !/[\^\$\*\.\_\~\`\+\=@\!\?\>\<\:\;\\\,\#\%\&]/.test(password))
      errors.push('REQUIRE_SYMBOLS');
    if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) errors.push('REQUIRE_UPPERCASE');
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
