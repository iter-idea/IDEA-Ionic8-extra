/**
 * Store the tokens and the info needed by Cognito's front-end lib to authenticate.
 */
export const storeCognitoSession = (idToken: string, accessToken: string, refreshToken: string): void => {
  const { sub } = decodeJWTToken(idToken);
  const { client_id } = decodeJWTToken(accessToken);
  const prefix = `CognitoIdentityServiceProvider.${client_id}`;
  window.localStorage.setItem(`${prefix}.LastAuthUser`, sub);
  window.localStorage.setItem(`${prefix}.${sub}.accessToken`, accessToken);
  window.localStorage.setItem(`${prefix}.${sub}.idToken`, idToken);
  window.localStorage.setItem(`${prefix}.${sub}.refreshToken`, refreshToken);
};

/**
 * Decode a JWT token and return its payload as a JSON object.
 */
const decodeJWTToken = (token: string): any => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
