import  axios from 'axios'

const getApiEndpoints = () => {
    const endpoints = []
    for (const k in process.env) {
        if (k.startsWith('API_ENDPOINT')) {
            endpoints.push(process.env[k])
        }
    }
    return endpoints
}

const getFrom = async (endpoint, accessToken) => {
    console.log('Calling ', endpoint)
    const options = {
        method: 'GET',
        url: endpoint,
        headers: accessToken ? {'Authorization': 'Bearer ' + accessToken} : undefined,
        validateStatus: () => true // always resolve the promise
    }
    const responseObject = await axios(options)
    console.log(`Got ${endpoint}`)
    return {status: responseObject.status, data: responseObject.data}
}

export default { getApiEndpoints, getFrom }