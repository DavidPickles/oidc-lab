import axios from 'axios'
import jwt from 'jsonwebtoken'

async function run() {
    const tokenEndpoint = process.env.IDP_BASE_URL + process.env.TOKEN_PATH
    const tokenRequestOptions = {
        method: 'POST',
        url: tokenEndpoint,
        data:  {
            grant_type:  "client_credentials",
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            scope: process.env.SCOPE,
            ...getOtherParams(process.env.OTHER_PARAMS)
        },
        headers: {'content-type': 'application/x-www-form-urlencoded'}
    }
    console.log("Token endpoint", tokenEndpoint )
    console.log( "POST Data: ", tokenRequestOptions.data)
    const tokResp = await axios(tokenRequestOptions)
    const decodedAccessToken = jwt.decode(tokResp.data.access_token, { complete: true })
    console.log("Access token header", decodedAccessToken.header )
    console.log("Access token payload", decodedAccessToken.payload )
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