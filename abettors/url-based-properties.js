import fs from 'fs'

function getPortForListening(baseUrl) {
    if (baseUrl.port) {
        return baseUrl.port
    } else if (baseUrl.protocol === 'https:') {
        return '443'
    } else if (baseUrl.protocol === 'http:') {
        return '80'
    } else {
        throw new Error('Protocol must be https: or http:')
    }
}

function getKeyAndCert(configDir, baseUrl) {
    if (baseUrl.protocol !== 'https:') {
        throw new Error(`${baseUrl} is not https, no Key and Cert files needed`)
    }
    const keyFileName = `${configDir}/${baseUrl.hostname}-key.pem`
    const certFileName = `${configDir}/${baseUrl.hostname}.pem`
    return {
            key: fs.readFileSync(keyFileName, "utf-8"),
            cert: fs.readFileSync(certFileName, "utf-8")
    }
}

export default { getPortForListening, getKeyAndCert }