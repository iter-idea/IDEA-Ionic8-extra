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
      singleSimultaneousSession: false
    }
  },
  aws: {
    cognito: {
      userPoolId: '',
      userPoolClientId: ''
    }
  }
};
