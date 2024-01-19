import { InjectionToken } from '@angular/core';

/**
 * The token to inject the app configurations in the module.
 */
export const IDEAEnvironmentConfig = new InjectionToken<IDEAEnvironmentConfiguration>('IDEA environment configuration');

/**
 * The environment variables used by this module.
 */
export interface IDEAEnvironmentConfiguration {
  idea: {
    project: string;
    ionicExtraModules: string[];
    app?: {
      version: string;
      bundle: string;
      appleStoreURL?: string;
      googleStoreURL?: string;
    };
    api?: {
      url: string;
      stage: string;
    };
    ideaApi?: {
      url: string;
      stage: string;
    };
    socket?: {
      url: string;
      stage: string;
    };
    auth?: {
      title?: string;
      website?: string;
      hasIntroPage?: boolean;
      registrationIsPossible: boolean;
      singleSimultaneousSession: boolean;
      forceLoginWithMFA: boolean;
      // note: the passwordPolicy should be set matching the configuration of the Cognito User Pool
      passwordPolicy?: {
        minLength: number;
        requireLowercase: boolean;
        requireDigits: boolean;
        requireSymbols: boolean;
        requireUppercase: boolean;
      };
    };
  };
  aws?: {
    cognito?: {
      userPoolId: string;
      userPoolClientId: string;
    };
  };
  google?: {
    apiClientId: string;
    apiScope: string;
    mapsApiKey: string;
  };
  microsoft?: {
    apiClientId: string;
    apiScope: string;
  };
  auth0?: {
    domain: string;
    clientId: string;
    callbackUri: string;
    storeRefreshToken: boolean;
  };
}
