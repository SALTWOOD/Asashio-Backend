export interface OidcOptions {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    jwks_uri: string;
    registration_endpoint?: string;
    scopes_supported: string[];
    response_types_supported: string[];
    response_modes_supported?: string[];
    grant_types_supported?: string[];
    subject_types_supported: string[];
    id_token_signing_alg_values_supported: string[];
}

export function getOidcOptions(baseUrl: string): OidcOptions {
    return {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/oauth/authorize`,
        token_endpoint: `${baseUrl}/api/v1/oauth/token`,
        userinfo_endpoint: `${baseUrl}/api/v1/user/info`,
        jwks_uri: `${baseUrl}/.well-known/jwks.json`,
        scopes_supported: ['openid', 'profile', 'email'],
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256']
    };
}