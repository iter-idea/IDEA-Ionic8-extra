/**
 * The environment variables used by this module.
 */
export const environment = {
  idea: {
    project: '',
    website: '',
    ionicExtraModules: ['auth'],
    app: {
      title: '',
      hasIntroPage: false
    },
    auth: {
      registrationIsPossible: false,
      singleSimultaneousSession: false,
      forceLoginWithMFA: false,
      // note: the passwordPolicy should be set matching the configuration of the Cognito User Pool
      passwordPolicy: {
        minLength: 8,
        requireLowercase: false,
        requireDigits: false,
        requireSymbols: false,
        requireUppercase: false
      }
    }
  },
  aws: {
    cognito: {
      userPoolId: '',
      userPoolClientId: ''
    }
  }
};
