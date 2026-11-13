/**
 * An external provider of the app (`aws.cognito.externalProviders` of the environment).
 */
export interface ExternalProvider {
  name: string;
  emailDomains: string[];
  /**
   * @deprecated every provider signs in on `auth/sso`: an app that still sets it keeps its route.
   */
  type?: string;
}

/**
 * The external provider that signs in the people of an email's domain, if any: their password is the provider's.
 */
export const getExternalProviderOfEmail = (
  providers: ExternalProvider[],
  email: string
): ExternalProvider | undefined => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return undefined;
  return providers.find(p => p.emailDomains.some(d => d.toLowerCase() === domain));
};
/**
 * Where the sign-in through an external provider starts at once.
 */
export const getExternalProviderSignInRoute = (
  provider: ExternalProvider
): { path: string[]; queryParams: { provider: string; go: boolean } } => ({
  path: ['auth', provider.type ?? 'sso'],
  queryParams: { provider: provider.name, go: true }
});

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

/**
 * What a sign-in through an external provider needs when it comes back: the `state` it must bring back, and the PKCE
 * verifier that only this page knows.
 */
export interface SSOFlow {
  state: string;
  verifier: string;
}

const SSO_FLOW_KEY = 'idea-auth-sso-flow';

/**
 * Start a sign-in through an external provider: its `state` and PKCE verifier, kept in the tab until it comes back.
 */
export const startSSOFlow = (): SSOFlow => {
  const flow: SSOFlow = { state: randomURLSafeString(), verifier: randomURLSafeString() };
  window.sessionStorage.setItem(SSO_FLOW_KEY, JSON.stringify(flow));
  return flow;
};
/**
 * The sign-in through an external provider started in this tab, once: a return can't be used twice.
 */
export const takeSSOFlow = (): SSOFlow | null => {
  try {
    const flow: SSOFlow = JSON.parse(window.sessionStorage.getItem(SSO_FLOW_KEY));
    window.sessionStorage.removeItem(SSO_FLOW_KEY);
    return flow?.state && flow?.verifier ? flow : null;
  } catch (_) {
    return null;
  }
};
/**
 * The PKCE challenge of a verifier, with the method `S256`.
 */
export const getPKCEChallenge = async (verifier: string): Promise<string> =>
  toBase64URL(new Uint8Array(await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));

const randomURLSafeString = (bytes = 32): string => toBase64URL(window.crypto.getRandomValues(new Uint8Array(bytes)));
const toBase64URL = (bytes: Uint8Array): string =>
  window
    .btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
