import 'express-async-errors'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import http from 'http'
import https from 'https'
import session from 'express-session'
import axios from 'axios'
import pkceChallenge  from 'pkce-challenge'
import utils from './abettors/utils.js'
import apis from './abettors/apis.js'
import urlBasedProps from './abettors/url-based-properties.js'
import idpPropertiesBuilder from './abettors/idp-properties-builder.js'
import Verifier from './abettors/verifier.js'
import outgoingRequestOpts from './abettors/outgoing-request-properties.js'

const app = express()

// have to do this rather than use app.locals, because I want to use variables 
// in path parameter to 'app.get()' and other middleware
const appProperties = {
    baseUrl: process.env.BASE_URL,
    callbackPath: process.env.CALLBACK_PATH ?? '/oauth-callback',
    namedApiEndpoints: apis.getNamedApiEndpoints(),
    homePath: process.env.HOME_PATH ?? '/',
    certsFolder: process.env.CERTS_FOLDER ?? './certs',
    title: process.env.APP_TITLE ?? 'No Name',
    spiel: process.env.SPIEL ??  ''
}

async function run() {
    app.locals.oidcProperties = await idpPropertiesBuilder.buildStaticProperties({
        mode: process.env.MODE,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        redirectUri: appProperties.callbackPath ? appProperties.baseUrl + appProperties.callbackPath : null,
        scope: process.env.SCOPE,
        otherParams: process.env.OTHER_PARAMS,
        logoutPath: process.env.LOGOUT_PATH,
        issuer: process.env.ISSUER,
        // either issuer or idpBaseUrl  but not both
        idpBaseUrl: process.env.IDP_BASE_URL,
        // if you have and idpBaseUrl you must have a token path and authorize path too
        tokenPath: process.env.TOKEN_PATH,
        authorizationPath: process.env.AUTHORIZE_PATH,
    })  
    app.locals.verifier = new Verifier(app.locals.oidcProperties.jwksUri)
    const baseUrl = new URL(appProperties.baseUrl)
    const server = baseUrl.protocol === 'https:' ? 
        https.createServer( urlBasedProps.getKeyAndCert(appProperties.certsFolder, baseUrl), app ) : 
        http.createServer( app )
    server.listen(urlBasedProps.getPortForListening(baseUrl), () => {
        console.log("Token Issuer:", app.locals.oidcProperties.issuer)
        console.log("Authorization Endpoint:", app.locals.oidcProperties.authorizationEndpoint)
        console.log("Token Endpoint:", app.locals.oidcProperties.tokenEndpoint)
        console.log("OIDC Lab Home", `${new URL(appProperties.homePath, baseUrl)}`)
    })
}

const myDir = dirname(fileURLToPath(import.meta.url))
app.use('/public-common', express.static( path.join(myDir, 'public')))
app.set('views',  path.join(myDir, 'views'))
app.set('view engine', 'ejs')

app.use(async (req, res, next) => {
    console.log(`${new Date().toUTCString()} ${req.path}`)
    next()
})

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false
}))


app.get(appProperties.homePath, async (req, res) => {
    console.log('Home. Issuer', app.locals.oidcProperties.issuer)
    console.log('Home. Cookie header', req.headers.cookie)
    console.log('Home. Logged in as', req.session.decodedIdToken ? req.session.decodedIdToken.payload.sub : '<not logged in>')
    if (req.session.decodedIdToken) {
        // I thought session variables are supposed to be available to template by default?
        res.render('logged-in', {refreshTokenReq:null, ...appProperties, ...req.session})
    } else {
        res.render('not-logged-in', {...appProperties})
    }
})

app.get('/login', async (req, res) => {
    console.log('Login. Cookie header',req.headers.cookie)
    console.log('Login. Logged in as',req.session.decodedIdToken ? req.session.decodedIdToken.sub : '<not logged in>')
    const oidcProps = app.locals.oidcProperties
    const pkce = await pkceChallenge()
    req.session.pkce_verifier = pkce.code_verifier
    let authorizeUrl = `${oidcProps.authorizationEndpoint}?` +
        `client_id=${oidcProps.clientId}&` +
        `response_type=code&` +
        (oidcProps.redirectUri ? `redirect_uri=${oidcProps.redirectUri}&` : '') +
        `scope=${oidcProps.scope}&` +
        `code_challenge=${pkce.code_challenge}&` +
        'code_challenge_method=S256' +
        oidcProps.otherParams ?? ''
    console.log('authorize url',authorizeUrl)
    req.session.authUrl = authorizeUrl
    res.redirect(authorizeUrl)
})

app.get(appProperties.callbackPath, async (req, res) => {
    req.session.callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    console.log('Callback. Cookie header',req.headers.cookie)
    console.log('Query ', JSON.stringify(req.query, null, 2))
    if (req.query.error) {
        return res.status(500).json(req.query)
    }
    console.log('getting access token using authorization_code grant_type')
    const oidcProps = app.locals.oidcProperties
    console.log('token endpoint',oidcProps.tokenEndpoint)
    const code = req.query.code
    const tokenRequestOptions = {
        ...outgoingRequestOpts,
        method: 'POST',
        url: oidcProps.tokenEndpoint,
        data:  {
            grant_type: "authorization_code",
            client_id: oidcProps.clientId,
            client_secret: oidcProps.clientSecret,
            code: code,
            redirect_uri: oidcProps.redirectUri,
            code_verifier: req.session.pkce_verifier
        },
        headers: {'content-type': 'application/x-www-form-urlencoded'}
    }
    req.session.tokenReq = utils.redactClientSecret(tokenRequestOptions)
    const tokResp = await axios(tokenRequestOptions)
    await verifyAndStoreTokens(tokResp.data, req.session)
    res.redirect('/call-api-endpoints')
})

app.get('/refresh', async(req, res) => {
    const refreshToken = req.session.refreshToken
    if (!refreshToken) {
        return res.status(400).send('No refresh token')
    }
    console.log('getting access token using refresh_token grant_type')
    const oidcProps = app.locals.oidcProperties
    console.log('Refresh token endpoint',oidcProps.tokenEndpoint)
    const refreshRequestOptions = {
        ...outgoingRequestOpts,
        method: 'POST',
        url: oidcProps.tokenEndpoint,
        data:  {
            grant_type: "refresh_token",
            client_id: oidcProps.clientId,
            client_secret: oidcProps.clientSecret,
            refresh_token: refreshToken,
            scope: oidcProps.scope
            // scope: utils.removeOfflineAccess(oidcProps.scope)
        },
        headers: {'content-type': 'application/x-www-form-urlencoded'}
    }
    req.session.refreshTokenReq = utils.redactClientSecret(refreshRequestOptions)
    const tokResp = await axios(refreshRequestOptions)
    await verifyAndStoreTokens(tokResp.data, req.session)
    res.redirect('/call-api-endpoints')
})

app.get('/call-api-endpoints', async(req, res) => {
    const accessToken = req.session.accessToken
    if (!accessToken) {
        return res.status(401).send('No access token')
    }
    req.session.endpointResps = await apis.getResponses(appProperties.namedApiEndpoints, accessToken)
    req.session.endpointResps.forEach( r => console.log(r) )
    res.redirect(appProperties.homePath)
})

app.get('/local-logout',  async (req,res) => {
    console.log('logging out')
    req.session.destroy( () => res.redirect(appProperties.homePath) )
})

app.get('/logout', async (req,res) => {
    console.log('logging out')
    const logoutUrl = `${process.env.IDP_BASE_URL}${process.env.LOGOUT_PATH}`
    req.session.destroy( () => res.redirect(logoutUrl) )
})

async function verifyAndStoreTokens(tokens, store) {
    const unpack = async (type) => {
        const token = tokens[type+'_token']
        if (app.locals.oidcProperties.jwksUri) {
            const decoded = await app.locals.verifier.verify(token, { complete: true })
            console.log(`${type} token verified`)
            store[type+'TokenIsVerified'] = true
            return decoded
        } else {
            console.log(`${type} token not verified`)
            store[type+'TokenIsVerified'] = false
            return app.locals.verifier.decode(token, { complete: true })
        }
    } 
    // console.log('Tokens', tokens)
    store.accessTokenIsJwt = app.locals.verifier.isJwt(tokens.access_token)
    if (store.accessTokenIsJwt) {
        store.decodedAccessToken = await unpack('access')
    } else {
        console.log('Opaque access token')
    }
    store.accessToken = tokens.access_token
    store.accessTokenExpiresIn = tokens.expires_in
    store.accessTokenWasIssuedAtMillis = (new Date()).getTime()
    store.decodedIdToken = await unpack('id')
    store.refreshToken = tokens.refresh_token ?? store.refreshToken ?? null
    console.log('Got tokens, now logged in as',store.decodedIdToken.payload.sub)
    return '/call-api-endpoints'
} 

run().catch(err => {
    console.error(err);
    process.exit(1);
})

