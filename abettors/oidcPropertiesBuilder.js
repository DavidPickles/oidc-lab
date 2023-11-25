import axios from 'axios'

async function buildStaticProperties( { issuer, clientId, clientSecret, redirectUri, 
                                    scope, otherParams, logoutPath, 
                                    idpBaseUrl, tokenPath, authorizationPath } ) {

    if (!issuer && !idpBaseUrl ) {
        throw new Error("No ISSUER or no IDP_BASE_URL")
    }
    if (issuer && (tokenPath || authorizationPath)) {
        throw new Error("Give ISSUER  or token/authorization paths, not both")
    }
    if (idpBaseUrl && !(tokenPath && authorizationPath)) {
        throw new Error("IDP_BASE_URL needs both a TOKEN_PATH and AUTHORIZE_PATH")
    }

    let oidcDiscoveryEndpoint = null
    let oidcConfig = null
    if ( issuer ) {
        oidcConfig = await getDiscoveryData(issuer)
    } else { // no issuer
        console.log("Warning NO ISSUER. Tokens will not be verified. OIDC discovery .well-known endpoint not used.")
        oidcConfig = {
            authorizationEndpoint: idpBaseUrl + authorizationPath,
            tokenEndpoint: idpBaseUrl + tokenPath
        }
    }
    return {
        issuer, oidcDiscoveryEndpoint,
        clientId, clientSecret, redirectUri, scope, otherParams, logoutPath,
        ...oidcConfig,
    }
}

async function getDiscoveryData(issuer) {
    const oidcDiscoveryEndpoint = `${issuer}/.well-known/openid-configuration`
    const oidcConfigResp = await axios.get(oidcDiscoveryEndpoint)
    validateDiscoveryData(oidcConfigResp.data)
    return {
        authorizationEndpoint: oidcConfigResp.data.authorization_endpoint,
        tokenEndpoint: oidcConfigResp.data.token_endpoint,
        jwksUri: oidcConfigResp.data.jwks_uri,
        rawDiscoveryData: oidcConfigResp.data
    }
}

async function validateDiscoveryData(data) {
    const validateField = field => {
        if (!data[field]) throw new Error(`Discovery data does not include ${field}`)
    }
    validateField('authorization_endpoint')
    validateField('token_endpoint')
    validateField('jwks_uri')
}

export default {buildStaticProperties}