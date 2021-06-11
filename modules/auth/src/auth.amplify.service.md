A copy of `auth.service` which uses the Amplify library.

The older lib (`amazon-cognito-identity-js`) is now umantained, but it's still working and still lighter than `aws-amplify/auth`.

When this changes, we can implement the following file (already tested) rather than the classic one.

```
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import Auth from '@aws-amplify/auth';

// from idea-config.js
declare const IDEA_PROJECT: string;
declare const IDEA_AWS_COGNITO_USER_POOL_ID: string;
declare const IDEA_AWS_COGNITO_WEB_CLIENT_ID: string;
declare const IDEA_AWS_COGNITO_ONLY_ONE_SIMULTANEOUS_SESSION: boolean;

/**
 * The name of the Cognito's user attribute which contains the key of the last device to login in this project.
 */
const DEVICE_KEY_ATTRIBUTE = 'custom:'.concat(IDEA_PROJECT);

/**
 * Cognito wrapper to manage the authentication flow.
 *
 * Note: in IDEA's Cognito users pools, the email is an alias of the username.
 */
@Injectable()
export class IDEAAuthService {
  constructor(protected storage: Storage) {
    Auth.configure({ userPoolId: IDEA_AWS_COGNITO_USER_POOL_ID, userPoolWebClientId: IDEA_AWS_COGNITO_WEB_CLIENT_ID });
  }
  /**
   * Perform a login through username and password.
   * @return promise: false -> success; true -> we need to confirm a new password.
   */
  public login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      Auth.signIn(username, password)
        .then(user => {
          if (user.challengeName === 'NEW_PASSWORD_REQUIRED') resolve(true);
          else resolve(false);
        })
        .catch((err: Error) => reject(err));
    });
  }
  /**
   * Complete a complete new password flow in the authentication.
   */
  public confirmNewPassword(username: string, tempPassword: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Auth.signIn(username, tempPassword)
        .then(user =>
          Auth.completeNewPassword(user, newPassword)
            .then(() => resolve())
            .catch(err => reject(err))
        )
        .catch(err => reject(err));
    });
  }
  /**
   * Register a new user a set its default attributes.
   */
  public register(username: string, password: string, attributes?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      attributes = attributes || {};
      // add the email, which is equal to the username for most of our Pools
      if (!attributes.email) attributes.email = username;
      // register the new user to the pool
      Auth.signUp({ username, password, attributes })
        .then(res => resolve(res.user))
        .catch(err => reject(err));
    });
  }
  /**
   * Confirm a new registration through the confirmation code sent by Cognito.
   */
  public confirmRegistration(username: string, code: string): Promise<void> {
    return Auth.confirmSignUp(username, code, { forceAliasCreation: true });
  }
  /**
   * Send again a confirmation code for a new registration.
   */
  public resendConfirmationCode(username: string): Promise<void> {
    return Auth.resendSignUp(username);
  }
  /**
   * Logout the currently signed in user.
   */
  public async logout(options?: { global: boolean }): Promise<void> {
    options = Object.assign({ global: false }, options);
    await this.storage.remove('AuthRefreshToken');
    await this.storage.remove('AuthUserDetails');
    return new Promise((resolve, reject) => {
      this.isAuthenticated(false)
        .then(async () => {
          // if a reference to the device was saved, forget it
          if (IDEA_AWS_COGNITO_ONLY_ONE_SIMULTANEOUS_SESSION) await this.setCurrentDeviceForProject(null);
          Auth.signOut(options)
            .then(() => resolve())
            .catch(err => reject(err));
        })
        // only the local data has been deleted
        .catch(() => resolve());
    });
  }
  /**
   * Send a password reset request.
   */
  public forgotPassword(username: string): Promise<void> {
    return Auth.forgotPassword(username);
  }
  /**
   * Confirm a new password after a password reset request.
   */
  public confirmPassword(username: string, code: string, newPwd: string): Promise<void> {
    return Auth.forgotPasswordSubmit(username, code, newPwd);
  }
  /**
   * Check if a user is currently authenticated.
   * @param offlineAllowed if set and if offline, skip authentication and retrieve data locally
   * @param getFreshIdTokenOnExp cb function to execute when the idToken is refreshed
   */
  public isAuthenticated(offlineAllowed: boolean, getFreshIdTokenOnExp?: (freshIdToken: string) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      if (offlineAllowed && !navigator.onLine) {
        this.storage.get('AuthUserDetails').then(userDetails => resolve({ idToken: null, userDetails }));
        // re-execute the method when back online, so that you can retrieve a token to make requests
        window.addEventListener('online', () =>
          this.isAuthenticated(true, getFreshIdTokenOnExp)
            // set the new token as if it was refreshed
            .then(result => getFreshIdTokenOnExp(result.idToken))
        );
      } else {
        Auth.currentUserInfo()
          .then(user =>
            Auth.currentSession()
              .then(session => {
                console.log(user, session);
                // add the user's groups to the attributes
                const sessionInfo = session.getAccessToken().decodePayload();
                const groups: string[] = sessionInfo['cognito:groups'] || [];
                user.attributes['groups'] = groups;
                // run some checks considering the user's groups and devices (based on the project's configuration)
                this.runPostAuthChecks(user.attributes, err => {
                  // in case some check failed, reject the authorisation flow
                  if (err) return reject(err);
                  // (async) save the refresh token so it can be accessed by other procedures
                  this.storage.set('AuthRefreshToken', session.getRefreshToken().getToken());
                  // set a timer to manage the autorefresh of the idToken (through the refreshToken)
                  setTimeout(
                    () => this.refreshSession(user, session.getRefreshToken().getToken(), getFreshIdTokenOnExp),
                    15 * 60 * 1000
                  ); // every 15 minutes
                  // (async) if offlineAllowed, save data locally, to use it next time we'll be offline
                  if (offlineAllowed) this.storage.set('AuthUserDetails', user.attributes);
                  // return the idToken (to use with API)
                  resolve({ idToken: session.getIdToken().getJwtToken(), userDetails: user.attributes });
                });
              })
              .catch(err => reject(err))
          )
          .catch(err => reject(err));
      }
    });
  }
  /**
   * Helper to refresh the session every N minutes.
   */
  protected refreshSession(userData: any, refreshToken: string, callback: (freshIdToken: string) => void) {
    Auth.currentAuthenticatedUser().then(cognitoUser => {
      cognitoUser.refreshSession(refreshToken, (err: Error, session: any) => {
        // if err: try again in 1 minute with the same refresh token
        if (err) setTimeout(() => this.refreshSession(userData, refreshToken, callback), 1 * 60 * 1000);
        else {
          // (async) save the refresh token so it can be accessed by other procedures
          this.storage.set('AuthRefreshToken', session.getRefreshToken().getToken());
          // repeat every 15 minutes
          setTimeout(() => this.refreshSession(userData, session.getRefreshToken(), callback), 15 * 60 * 1000);
          // run the callback action, if set
          if (callback) callback(session.getIdToken().getJwtToken());
        }
      });
    });
  }
  /**
   * Run some post-auth checks, based on the users groups and on the app's configuration:
   *  - users in the Cognito's "admins" grup skip all the following rules.
   *  - users in the Cognito's "robots" group can't sign-into front-ends (they serve only back-end purposes).
   *  - if `IDEA_AWS_COGNITO_ONLY_ONE_SIMULTANEOUS_SESSION` is on, make sure there is only one active session per user.
   */
  protected runPostAuthChecks(userDetails: any, callback: (err?: Error) => void) {
    const groups: string[] = userDetails['groups'];
    // skip checks if the user is in the "admins" group
    const isAdmin = groups.some(x => x === 'admins');
    if (isAdmin) return callback();
    // users in the "robots" group can't sign-into front-ends (they serve only back-end purposes)
    const isRobot = groups.some(x => x === 'robots');
    if (isRobot) return callback(new Error('ROBOT_USER'));
    // in case the project limits each account to only one simultaneous session, run a check
    if (IDEA_AWS_COGNITO_ONLY_ONE_SIMULTANEOUS_SESSION) return this.checkForSimultaneousSessions(userDetails, callback);
    // otherwise, we're done
    callback();
  }
  /**
   * Check whether the user signed-into multiple devices.
   */
  protected async checkForSimultaneousSessions(userDetails: any, callback: (err?: Error) => void) {
    // get or create a key for the current device (~random)
    let currentDeviceKey = await this.storage.get('AuthDeviceKey');
    if (!currentDeviceKey) {
      const randomKey = Math.random().toString(36).substring(10);
      currentDeviceKey = randomKey.concat(String(Date.now()));
      await this.storage.set('AuthDeviceKey', currentDeviceKey);
    }
    // check whether the last device to sign-into this project (if any) is the current one
    const lastDeviceToSignIntoThisProject = userDetails[DEVICE_KEY_ATTRIBUTE];
    // if it's the first user's device to sign-in, save the reference in Cognito and resolve
    if (!lastDeviceToSignIntoThisProject) {
      this.setCurrentDeviceForProject(currentDeviceKey)
        .then(() => callback())
        .catch(() => callback(new Error('CANT_SET_DEVICE')));
      // if the device didn't change, resolve
    } else if (lastDeviceToSignIntoThisProject === currentDeviceKey) callback();
    // othwerwise, report there is more than one simultaneous session
    else callback(new Error('SIMULTANEOUS_SESSION'));
  }
  /**
   * Set (or reset) the current user's device (by key) in the current project (stored in Cognito).
   */
  protected setCurrentDeviceForProject(deviceKey?: string): Promise<void> {
    const attributes: any = {};
    // note: an empty string will remove the attribute from Cognito
    attributes[DEVICE_KEY_ATTRIBUTE] = deviceKey || '';
    return this.updateUserAttributes(attributes);
  }
  /**
   * Update the currently logged in user's attributes.
   */
  public updateUserAttributes(attributes: any): Promise<void> {
    return new Promise((resolve, reject) => {
      Auth.currentAuthenticatedUser().then(user => {
        if (!user) return reject();

        // prepare the attributes we want to change
        Object.keys(attributes).forEach(key => (user.attributes[key] = attributes[key]));

        Auth.updateUserAttributes(user, user.attributes)
          .then(() => resolve())
          .catch(err => reject(err));
      });
    });
  }
}
```
