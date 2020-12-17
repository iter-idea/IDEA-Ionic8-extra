import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

import * as Cognito from 'amazon-cognito-identity-js';

// from idea-config.js
declare const IDEA_AWS_COGNITO_USER_POOL_ID: string;
declare const IDEA_AWS_COGNITO_WEB_CLIENT_ID: string;

/**
 * Cognito wrapper to manage the authentication flow.
 *
 * Note: in IDEA's Cognito users pools, the email is an alias of the username.
 */
@Injectable()
export class IDEAAuthService {
  protected userPool: Cognito.CognitoUserPool;

  constructor(protected storage: Storage) {
    this.userPool = new Cognito.CognitoUserPool({
      UserPoolId: IDEA_AWS_COGNITO_USER_POOL_ID,
      ClientId: IDEA_AWS_COGNITO_WEB_CLIENT_ID
    });
  }

  /**
   * Prepare the necessary structure to get authorized in Cognito.
   */
  protected prepareAuthDetails(username: string, pwd: string): Cognito.AuthenticationDetails {
    return new Cognito.AuthenticationDetails({ Username: username, Password: pwd });
  }
  /**
   * Prepare the necessary structure to identify a Cognito user.
   */
  protected prepareCognitoUser(username: string): Cognito.CognitoUser {
    return new Cognito.CognitoUser({ Username: username, Pool: this.userPool });
  }
  /**
   * Prepare a user attribute (they are all strings) in Cognito's format.
   */
  protected prepareUserAttribute(name: string, value: string): Cognito.CognitoUserAttribute {
    return new Cognito.CognitoUserAttribute({ Name: name, Value: value });
  }

  /**
   * Perform a login through username and password.
   */
  public login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // get a cognito user and try to authenticate
      this.prepareCognitoUser(username).authenticateUser(this.prepareAuthDetails(username, password), {
        onSuccess: () => resolve(false),
        onFailure: (err: Error) => reject(err),
        newPasswordRequired: () => resolve(true)
      });
    });
  }
  /**
   * Complete a complete new password flow in the authentication.
   */
  public confirmNewPassword(username: string, tempPassword: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // login with the old password
      const user = this.prepareCognitoUser(username);
      user.authenticateUser(this.prepareAuthDetails(username, tempPassword), {
        onSuccess: () => resolve(),
        onFailure: (err: Error) => reject(err),
        newPasswordRequired: () =>
          // complete the new password challenge
          user.completeNewPasswordChallenge(
            newPassword,
            {},
            {
              onSuccess: () => resolve(),
              onFailure: (err: Error) => reject(err)
            }
          )
      });
    });
  }
  /**
   * Register a new user a set its default attributes.
   */
  public register(username: string, password: string, attributes?: any): Promise<Cognito.CognitoUser> {
    attributes = attributes || {};
    return new Promise((resolve, reject) => {
      // add attributes like the email address and the fullname
      const attrs = [];
      for (const prop in attributes) {
        if (attributes[prop]) {
          attrs.push(this.prepareUserAttribute(prop, attributes[prop]));
        }
      }
      // add the email, which is equal to the username for most of our Pools
      if (!attributes.email) {
        attrs.push(this.prepareUserAttribute('email', username));
      }
      // register the new user to the pool
      this.userPool.signUp(username, password, attrs, null, (err: Error, res: Cognito.ISignUpResult) =>
        err ? reject(err) : resolve(res.user)
      );
    });
  }
  /**
   * Confirm a new registration through the confirmation code sent by Cognito.
   */
  public confirmRegistration(username: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.prepareCognitoUser(username).confirmRegistration(code, true, (err: Error) =>
        err ? reject(err) : resolve()
      );
    });
  }
  /**
   * Send again a confirmation code for a new registration.
   */
  public resendConfirmationCode(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.prepareCognitoUser(username).resendConfirmationCode((err: Error) => (err ? reject(err) : resolve()));
    });
  }
  /**
   * Logout the currently signed in user.
   */
  public logout(dontReload?: boolean) {
    this.isAuthenticated(false)
      .then(() => {
        this.userPool.getCurrentUser().signOut();
        if (!dontReload) {
          window.location.assign('');
        }
      })
      .catch(() => window.location.assign(''));
  }
  /**
   * Send a password reset request.
   */
  public forgotPassword(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.prepareCognitoUser(username).forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err: Error) => reject(err)
      });
    });
  }
  /**
   * Confirm a new password after a password reset request.
   */
  public confirmPassword(username: string, code: string, newPwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // get the user and confirm a new password
      this.prepareCognitoUser(username).confirmPassword(code, newPwd, {
        onSuccess: () => resolve(),
        onFailure: (err: Error) => reject(err)
      });
    });
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
        const user = this.userPool.getCurrentUser();
        if (!user) {
          return reject();
        }
        user.getSession((err: Error, session: Cognito.CognitoUserSession) => {
          if (err) {
            return reject(err);
          }
          // get user attributes
          user.getUserAttributes((e: Error, attributes: Array<Cognito.CognitoUserAttribute>) => {
            if (e) {
              return reject(e);
            }
            // remap user attributes
            const userDetails: any = [];
            attributes.forEach((a: Cognito.CognitoUserAttribute) => (userDetails[a.getName()] = a.getValue()));
            // set a timer to manage the autorefresh of the idToken (through the refreshToken)
            setTimeout(
              () => this.refreshSession(user, session.getRefreshToken().getToken(), getFreshIdTokenOnExp),
              15 * 60 * 1000
            ); // every 15 minutes
            // if offlineAllowed, save data locally, to use it next time we'll be offline
            if (offlineAllowed) {
              this.storage.set('AuthUserDetails', userDetails); // async
            }
            // return the idToken (to use with API)
            resolve({ idToken: session.getIdToken().getJwtToken(), userDetails });
          });
        });
      }
    });
  }
  /**
   * Helper to refresh the session every N minutes.
   */
  protected refreshSession(user: Cognito.CognitoUser, refreshToken: string, callback: (freshIdToken: string) => void) {
    user.refreshSession(
      new Cognito.CognitoRefreshToken({ RefreshToken: refreshToken }),
      (err: Error, session: Cognito.CognitoUserSession) => {
        if (err) {
          // try again in 1 minute
          setTimeout(() => this.refreshSession(user, refreshToken, callback), 1 * 60 * 1000);
        } else {
          // every 15 minutes
          setTimeout(() => this.refreshSession(user, session.getRefreshToken().getToken(), callback), 15 * 60 * 1000);
          if (callback) {
            callback(session.getIdToken().getJwtToken());
          }
        }
      }
    );
  }
  /**
   * Update the currently logged in user's attributes.
   */
  public updateUserAttributes(attributes: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // prepare the attributes we want to change
      const attrs = new Array<any>();
      for (const prop in attributes) {
        if (attributes[prop]) {
          attrs.push(this.prepareUserAttribute(prop, attributes[prop]));
        }
      }
      const user = this.userPool.getCurrentUser();
      if (!user) {
        return reject();
      }
      // we need to get the session before to make changes
      user.getSession((err: Error) => {
        if (err) {
          reject(err);
        } else {
          user.updateAttributes(attrs, (e: Error) => (e ? reject(e) : resolve()));
        }
      });
    });
  }
}
