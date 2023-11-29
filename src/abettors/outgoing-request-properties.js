import crypto from 'crypto'
import https from 'https'


const getOutgoingRequestOpts = ({insecureHttps}) => {
    const opts = {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      })
    }
    if (insecureHttps) {
        console.log("Warning: Insecure HTTPS")
        return opts
    } else {
        return {}
    }
}
 

export default getOutgoingRequestOpts