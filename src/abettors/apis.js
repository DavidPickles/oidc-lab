import  axios from 'axios'
import outgoingRequestOpts from './abettors/outgoing-request-properties.js'

const getNamedApiEndpoints = () => {
    const endpoints = []
    for (const envVar in process.env) {
        const prefix = 'API_ENDPOINT_'
        if (envVar.startsWith(prefix)) {
            const name = envVar.substring( prefix.length )
            endpoints.push({name, url: process.env[envVar]})
        }
    }
    return endpoints
}

const getResponse = async (namedEndpoint, accessToken, axiosOpts) => {
    // console.log('Calling ', endpoint)
    const options = {
        ...outgoingRequestOpts,
        method: 'GET',
        url: namedEndpoint.url,
        headers: accessToken ? {'Authorization': 'Bearer ' + accessToken} : undefined,
        validateStatus: () => true, // always resolve the promise
    }
    const responseObject = await axios(options)
    // console.log(`Got ${endpoint}`)
    return {...namedEndpoint, status: responseObject.status, data: responseObject.data}
}

const getResponses = async (namedApiEndpoints, accessToken)  => {
    const endpointResps = []
    for ( const namedEndpoint of namedApiEndpoints ) {
        endpointResps.push(await getResponse(namedEndpoint, accessToken))
    }    
    return endpointResps
}


export default { getNamedApiEndpoints, getResponse, getResponses }