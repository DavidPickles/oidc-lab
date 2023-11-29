import crypto from 'crypto'
import https from 'https'

const insecureHttps = {
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    }),
}

export default {insecureHttps}