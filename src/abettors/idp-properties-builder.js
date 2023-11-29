import axios from 'axios'
import outgoingRequestOpts from './abettors/outgoing-request-properties.js'


async function buildStaticProperties( {  mode, issuer, clientId, clientSecret, redirectUri, 
                                    scope, otherParams, logoutPath, 
                                    idpBaseUrl, tokenPath, authorizationPath } ) {

    if (mode !== 'm2m' && mode !== 'oidc') {
        throw new Error("MODE must be 'm2m' or 'oidc'")
    }
    if (!issuer && !idpBaseUrl ) {
        throw new Error("No ISSUER or no IDP_BASE_URL")
    }
    if (issuer && (tokenPath || authorizationPath)) {
        throw new Error("Give ISSUER  or token/authorization paths, not both")
    }
    if (mode === 'oidc') {
        if (idpBaseUrl && !(tokenPath && authorizationPath)) {
            throw new Error("In oidc mode, IDP_BASE_URL needs both a TOKEN_PATH and AUTHORIZE_PATH")
        }
    } else if (mode === 'm2m') {
        if (idpBaseUrl && !(tokenPath)) {
            throw new Error("In m2m mode, IDP_BASE_URL needs a TOKEN_PATH")
        }
    }

    let oidcDiscoveryEndpoint = null
    let idpConfig = null
    if ( issuer ) {
        idpConfig = await getDiscoveryData(issuer)
    } else { // no issuer
        console.log("Warning NO ISSUER. Tokens will not be verified. OIDC discovery .well-known endpoint not used.")
        idpConfig = {
            tokenEndpoint: idpBaseUrl + tokenPath
        }
        if (mode === 'oidc') {
            idpConfig.authorizationEndpoint = idpBaseUrl + authorizationPath
        } 
    }
    return {
        issuer, oidcDiscoveryEndpoint,
        clientId, clientSecret, redirectUri, scope, otherParams, logoutPath,
        ...idpConfig,
    }
}

async function getDiscoveryData(issuer) {
    const oidcDiscoveryEndpoint = `${issuer}/.well-known/openid-configuration`
    const oidcConfigResp = await axios.get(oidcDiscoveryEndpoint, ...outgoingRequestOpts)
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