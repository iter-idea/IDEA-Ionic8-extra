A copy of `auth.service` which uses the Amplify library.

The older lib (`amazon-cognito-identity-js`) is now umantained, but it's still working and still lighter than `aws-amplify/auth`.

When this changes, we can implement the following file (already tested) rather than the classic one.

```
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import Auth from '@aws-amplify/auth';

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
 constructor(protected storage: Storage) {
   Auth.configure({
     userPoolId: IDEA_AWS_COGNITO_USER_POOL_ID,
     userPoolWebClientId: IDEA_AWS_COGNITO_WEB_CLIENT_ID
   });
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
 public async logout(dontReload?: boolean) {
   this.isAuthenticated(false)
     .then(() =>
       Auth.signOut()
         .then(() => {
           if (!dontReload) window.location.assign('');
         })
         .catch(() => window.location.assign(''))
     )
     .catch(() => window.location.assign(''));
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
               // set a timer to manage the autorefresh of the idToken (through the refreshToken)
               setTimeout(() => this.refreshSession(session.getRefreshToken(), getFreshIdTokenOnExp), 15 * 60 * 1000); // every 15 minutes
               // if offlineAllowed, save data locally, to use it next time we'll be offline
               if (offlineAllowed) this.storage.set('AuthUserDetails', user.attributes).catch(() => {}); // ignore err
               // return the idToken (to use with API)
               resolve({ idToken: session.getIdToken().getJwtToken(), userDetails: user.attributes });
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
 protected refreshSession(refreshToken: any, callback: (freshIdToken: string) => void) {
   Auth.currentAuthenticatedUser().then(cognitoUser => {
     cognitoUser.refreshSession(refreshToken, (err: Error, session: any) => {
       // if err: try again in 1 minute with the same refresh token
       if (err) setTimeout(() => this.refreshSession(refreshToken, callback), 1 * 60 * 1000);
       else {
         // every 15 minutes
         setTimeout(() => this.refreshSession(session.getRefreshToken(), callback), 15 * 60 * 1000);
         if (callback) callback(session.getIdToken().getJwtToken());
       }
     });
   });
 }
}
```
