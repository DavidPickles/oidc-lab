# Certificates, Keys, and CAs

There are two scenarios for which OIDC-Lab needs access to certificates or keys:

- OIDC-Lab in oidc mode uses HTTPS for the pages it presents. 
- An OP running locally using HTTPS depends on a local certificate authority (CA).

The solutions to these cases have some similarities, but they are different scenarios. 

By default OIDC-Lab expects certificates and keys to be in a certificates folder. By default this is `certs`. If you really have to, this can be changed with the CERTS_FOLDER variable in the .env configuration file. 

For the first scenario OIDC-Lab enables a browser to show pages under HTTPS. The browser is a TLS client served by OIDC-Lab. The certificates folder should contain certificate and private key .pem files. For instance it might contain:

- example2.internal.pem - the signed certificate for example2.internal.
- example2.internal-key.pem - the corresponding private key for example2.internal.

For the second scenario where the OP uses a local CA,  OIDC-Lab is the TLS client and needs access to the local CA certificate used by the OP. For some solutions to this case, a copy of the local CA certificate is stored in the certificates folder. 

## 1. HTTPS for OIDC-Lab pages.

Some providers (eg Microsoft Entra ID) require HTTPS for the callback url, therefore OIDC-Lab has enable a browser to present its pages under HTTPS. Its BASE_URL must start `https://`. This means three things. First, OIDC-Lab needs a private key to encrypt data it sends to the browser. Secondly, OIDC-Lab needs a certificate to send to the browser during the TLS handshake, the certificate contains a public key and signature from a certificate authority (CA). And, thirdly, the browser needs access to the CA which created the signature.

To do this use https://github.com/FiloSottile/mkcert. Once you've installed mkcert:

```
$ mkcert -install
```
You only have to one this once for your machine. It creates a new local certificate authority (CA) and puts it in the mkcert application support folder. The CA is a private key and a certificate. The certificate is copied to the system's trust store, so browsers will use it.  The certificate is basically a signed public key. Because it's a CA, the certificate is self-signed by the CA's own private key.

To enable HTTPS for OIDC-Lab's BASE_URL you need to put a private key and a certificate for its domain in the certificates folder. To do that:

Change directory to the certificates folder:

```
cd certs
```
Then:
```
$ mkcert <hostname>
```
This creates a private key `<hostname>-key.pem` and a certificate file `<hostname>.pem` in the certificates folder.  The certificate is, basically, a public key and a domain name signed by  mkcert's CA's private key. So unlike the CA's certificate, it is not self-signed, it is signed by the CA. The fact it's signed by the CA means that a consumer of the certificate such as a browser which trusts the CA can infer that the server behind the domain name has been verified by the CA. 

These files are needed by OIDC-Lab to serve HTTPS requests. Because they are in the certificates folder, OIDC-Lab picks them up automatically.

On Windows, mkcert Doesn't work for Firefox, so you can't use Firefox as your browser.

## 2. HTTPS for an OP on localhost

There are various solutions to this, only one of which I've tested. 

### A dotnet Windows OP.

This enables HTTPS for a locally hosted OpenID Provider based on dotnet that is running on Windows (for example Duende Identity Server).

First create a self-signed certificate for localhost and add it to the local CA trust store: 

`dotnet dev-certs https --trust`

Node.js isn't aware of the local CA trust store. This causes a problem.  When OIDC-Lab tries to make a request to https://localhost (which happens at the last step of the Authorization Code Flow as OIDC-Lab tries to obtain tokens from the OP), you'll get an error something like this:

```
Error: self-signed certificate
    at AxiosError.from (C:\Users\david.Pickles\bhcode\Research_Identity\OIDC-Lab\node_modules\axios\dist\node\axios.cjs:836:14)
    ...
```

To fix this you need to export a copy of the certificate and tell OIDC-Lab that it is a CA certificate. 

Create a copy of localhost.pem in the certificates folder: 

```
cd certs
dotnet dev-certs https --export-path localhost.pem --no-password --format pem
```
To tell Node.js that this is a CA certificate you have to set an environment variable:  

```
$Env:NODE_EXTRA_CA_CERTS = "certs/localhost.pem"
```

### Other Local HTTPS OP Scenarios

Other configurations with  a local OP using HTTPS are possible:

- Other operating systems than Windows. 
- OPs that don't use dotnet.
- Other domains than `localhost` for the OP.

But I've not tested these. The approach would be:

- Use mkcert to create a certificate and key for the local OP domain. 
- Ensure the OP knows about the certificate and key and can use them in TLS. 
- Ensure OIDC-Lab knows about the CA by setting the environment variable NODE_EXTRA_CA_CERTS to point to the path of mkcerts CA, e.g. `NODE_EXTRA_CA_CERTS=$(mkcert --CAROOT)`

