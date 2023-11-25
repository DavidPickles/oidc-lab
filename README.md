# OIDC Lab

![Baily the Golden Labrador Retriever](./img/lab-screenshot-0.jpg)

OIDC-Lab is a configurable OAuth2 client which can be used to demonstrate and test [OAuth2 authorization servers and OpenId Providers](). 

## System Requirements

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en)

Tested with Node v17, v18 and v19; it'll probably work with earlier versions too. 

## Install

```
git clone https://github.com/DavidPickles/oidc-lab.git
cd oidc-lab
npm install
```

## Configure and test

OIDC-Lab is a configurable OAuth2 client. Configuration files are .env files in sub-folders of the configs folder. You  manage your own configurations in configs, but two sample .env templates are provided to show how things work.  Both samples connect to [Duende's Public Demo Server](https://demo.duendesoftware.com/); one sample demonstrates OIDC Authorization Code Flow, the other demonstrates OAuth2 Client Credentials Flow. 

### 1. Configure

```
mkdir configs
```

Then copy the folders in config-samples/ to configs/. 

```
cp -r config-samples/* configs
```

You now have two folders containing .env  files. 

```
configs/duende-demo-server
   .env
configs/m2m-deunde-demo-server
   .env
```

In general it's bad practice to store .env files in source control because they contain secrets. However Duende's public demo advertises its client secret; so in this case it really isn't secret at all. 


### 2. Run the OIDC app

```
node ./server.js "duende-demo-server"
```

### 3. Browse 
Then point your browser at http://localhost:9023. You should see something like this:

![Home page](./img/lab-screenshot-1.png)

Click Log-in and you'll be taken to the Duende public demo log-in page. 

![Login page](./img/lab-screenshot-2.png)

The Duende log-in page tells you the username and passwords that are available. 

After you login, your page should look something like this:

![lab-screenshot](./img/lab-screenshot-3.png)

## Cookies and Logout

The logout feature of OIDC-Lab is limited. 

Cookies tend to be used extensively by OPs to represent a users logged-in state. 

When you're exploring OPs it can be hard to keep track of which users are logged in, so it can be useful to be able to just remove all potentially relevant cookies. For that reason it is generally a good idea to use private browsing or incognito mode, because you'll always start with no cookies set.

## Using your own configuration repo

You can use your own repo in the configs folder. However because .env files typically contain secrets they, must not be stored in the code repo. They are excluded by a .gitignore rule.

It is good practice to store the configurations as env.template files, with client and cookie secrets removed. 

## Hosts other than localhost

Localhost can behave differently in some contexts than other domain names, so you might wish to use an alternative. This means changing your local hosts file. 

On Windows, the hosts file is at:

```
C:\Windows\System32\drivers\etc\hosts
```

On a mac:

```
/etc/hosts
```

You need to add a line such as:

```
127.0.0.1     example1.internal
```

This will mean that OIDC-Lab can run on example1.internal. You'll need to change BASE_URL in the .env file to use this domain. 

## Reference for .env files

Note the use of IDP_BASE_URL, AUHTORIZE_PATH, and TOKEN_PATH are deprecated. ISSUER should be used instead. ISSUER will trigger the use of the [OIDC Well Known Discovery Document](https://oauth.net/2/authorization-server-metadata/).   
- Endpoints and other information such as private keys will be be obtained from the discovery document.
- The private keys will be used to verify the tokens returned by the OP.
- Not every OP provides a discovery document. For those (rare) cases which don't, continue to use IDP_BASE_URL with TOKEN_PATH and AUTHORIZE_PATH. 
- ISSUER and IDP_BASE_URL are exclusive. If you specify both you'll get an error. 
- If you use IDP_BASE_URL:
  - You must specify TOKEN_PATH and AUTHORIZE_PATH
  - Token verification and potentially other features which rely on the discovery document won't be available (not that they've been implemented yet)

Parameter | Opt/Req | Meaning
--|--|--
CLIENT_ID | Required | A client id registered on the OP
CLIENT_SECRET | Required if the registered client is confidential | The corresponding client secret
ISSUER | Required if no IDP_BASE_URL | The domain of the OIDC discovery document 
IDP_BASE_URL | Required if no ISSUER | Base URL of the OP
AUTHORIZE_PATH | Required if IDP_BASE_URL | The path of authorization endpoint of the OP
TOKEN_PATH | Required if IDP_BASE_URL | The path of the token endpoint of the OP
SCOPE | Required | Scope parameter to the authorization request. 
APP_TITLE | Required | Title that will appear on the OIDC-Lab home page. 
SPIEL | Required | A description that will appear on the OIDC-Lab home page. 
API_ENDPOINT-\<n> | Opt | API Endpoints that will be called by OIDC-Lab with the access token as a bearer token.  Values of n can be 1-9.
BASE_URL | Required | The URL under which OIDC-Lab will run,
CALL_BACK_PATH | Opt | By default the redirect_uri (OIDC callback) is `BASE_URL/oauth-callback`, but this parameter can be used to override it.
COOKIE_SECRET | Required | Used for encrypting local session cookies. 
HOME_PATH | By default the home URL of the app is BASE_URL, this parameter can override it


## HTTPS for OIDC-Lab app 

*You need this if you want to run the OIDC-Lab application under HTTPS*

Some providers (eg Azure) require HTTPS for callback url. For those you need a private key and certificate file in the config folder along with the .env file. 

To do this use https://github.com/FiloSottile/mkcert. Once you've installed mkcert you need to do this:

```
$ mkcert -install
```
You only have to one this once for your machine. It creates new local certificate authority (CA) and puts it in the mkcert application support folder. The CA is a private key and a certificate. The certificate is copied to the system's trust store.  The certificate is basically a signed public key. Because its a CA, the certificate is self-signed by the CA's own private key.

To enable HTTPS for the domain of the BASE_URL in the .env file, you need to create a private key and a certificate  in the folder which holds the .env file. 

Change directory to that folder. 

```
cd configs/<config dir>
```
Then:
```
$ mkcert <hostname>
```
This creates a private key `<hostname>-key.pem` and a certificate file `<hostname>.pem` in the config directory. The certificate is, basically, a public key and a domain name signed by  mkcert's CA's private key. So unlike the CA's certificate, it is not self-signed, it is signed by the CA. The fact it's signed by the CA means that a consumer of the certificate - such as a browser - who trusts the CA can infer that the server behind the domain name has been verified by the CA. 

These files are needed by OIDC-Lab to serve HTTPS requests. Because they are in the config directory, OIDC-Lab picks them up automatically.

On Windows, mkcert Doesn't work for windows/firefox. So you can't use Firefox as your browser.

```
PS> mkcert -install
Created a new local CA 💥
The local CA is now installed in the system trust store! ⚡️
Note: Firefox support is not available on your platform. ℹ️
```

## HTTPS for an OP on localhost (Windows only)

*You need this if you want to run a locally hosted OpenID Provider (for example IDS) under HTTPS*

 If IDS is running on windows locally on localhost, then you should use:

`dotnet dev-certs https --trust`

This creates a usable self-signed certificate for localhost and adds it to the local CA trust store. 

Node.js isn't able to see the certificate which causes a problem.  When OIDC-Lab tries to make a request to https://localhost (which happens at the last step of the Authorization Code Flow, when OIDC-Lab tries to obtain tokens from the OP), you'll get an error something like this:

```
Error: self-signed certificate
    at AxiosError.from (C:\Users\david.Pickles\bhcode\Research_Identity\OIDC-Lab\node_modules\axios\dist\node\axios.cjs:836:14)
    ...
```

To fix this you need to export a copy of the certificate and tell Node.js about it. You do that as follows: 

```
cd configs/<config dir>
```

Create a localhost.pem file in the `<config dir>`: 

```
dotnet dev-certs https --export-path localhost.pem --no-password --format pem
```
Before you run node, you have to tell Node about the certificate via an environment variable. On Windows:
```
$Env:NODE_EXTRA_CA_CERTS = "configs/<config dir>/localhost.pem"
```
(I haven't tried using some other hostname for the OP on Windows. That could be an issue, because as I understand it dotnet dev-certs https only works for localhost.)

