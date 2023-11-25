import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'


class Verifier {

    constructor(jwksUri) {
        this._jwksClient = jwksClient({ jwksUri: jwksUri })
    }

    isJwt(token) {
        const parts = token.split('.');
        if (parts.length !== 3) return false
        try {
            const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
            return header.typ === 'JWT' || header.typ === 'at+jwt' || header.typ === 'application/at+jwt'
        } catch (error) {
            return false;
        }
    }

    decode(token, options) {
        return jwt.decode(token, options)
    }

    async verify(token, options) {
        const getKey = (header, callback) => {
            this._jwksClient.getSigningKey(header.kid, (err, key) => {
                if (err) return callback(err)
                callback(null, key.publicKey || key.rsaPublicKey)
            })
        }
        return new Promise((resolve, reject) => {
            jwt.verify(token, getKey, options, (err, decoded) => {
                if (err) return reject(err)
                resolve(decoded)
            })
        })
    }
}

export default Verifier