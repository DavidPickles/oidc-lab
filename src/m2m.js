import axios from 'axios'
import idpPropertiesBuilder from './abettors/idp-properties-builder.js'
import Verifier from './abettors/verifier.js'
import apis from './abettors/apis.js'


async function run() {
    const idpProps = await idpPropertiesBuilder.buildStaticProperties({
        mode: process.env.MODE,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        scope: process.env.SCOPE,
        otherParams: process.env.OTHER_PARAMS,
        logoutPath: process.env.LOGOUT_PATH,
        issuer: process.env.ISSUER,
        // either issuer or idpBaseUrl  but not both
        idpBaseUrl: process.env.IDP_BASE_URL,
        // if you have and idpBaseUrl you must have a token path
        tokenPath: process.env.TOKEN_PATH
    })  
    console.log("jwksUri", idpProps.jwksUri)
    const verifier = new Verifier(idpProps.jwksUri)
    const namedApiEndpoints =  apis.getNamedApiEndpoints()
    const tokenRequestOptions = {
        method: 'POST',
        url: idpProps.tokenEndpoint,
        data:  {
            grant_type:  "client_credentials",
            client_id: idpProps.clientId,
            client_secret: idpProps.clientSecret,
            scope: idpProps.scope,
            ...getOtherParams(idpProps.otherParams)
        },
        headers: {'content-type': 'application/x-www-form-urlencoded'}
    }
    console.log("Token endpoint", idpProps.tokenEndpoint )
    console.log( "POST Data: ", tokenRequestOptions.data)
    const tokResp = await axios(tokenRequestOptions)
    const token = tokResp.data.access_token
    let decodedAccessToken
    let isVerified = false
    if (idpProps.jwksUri) {
        decodedAccessToken = await verifier.verify(token, { complete: true })
        isVerified = true
    } else {
        decodedAccessToken = verifier.decode(token, { complete: true })
    }
    console.log("Access token header", decodedAccessToken.header )
    console.log("Access token payload", decodedAccessToken.payload )
    if (isVerified) {
        console.log(`Access token verified by ${idpProps.jwksUri}`)
    } else {
        console.log(`Access token not verified`)
    }
    if (namedApiEndpoints.length) {
        console.log("API Calls")
        const endpointResps = await apis.getResponses(namedApiEndpoints, token)
        endpointResps.forEach( r => console.log(r) )
    }
    console.log()
}

function getOtherParams(str) {
    const result = {};
    if (!str) {
        return result
    }
    // Remove leading and trailing '&'
    str = str.replace(/^&+|&+$/g, '');
    const keyValuesStrs = str.split('&');
    for (let i = 0; i < keyValuesStrs.length; i++) {
        const pair = keyValuesStrs[i].split('=');
        if (pair.length == 2) {
            result[pair[0]] = pair[1];
        } else {
            throw new Error(`Invalid OTHER_PARAMS str: ${str}`)
        }
    }
    return result;
}

run()