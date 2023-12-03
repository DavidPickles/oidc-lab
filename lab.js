import path, { dirname } from 'path'
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv'

const pkg = getPackage()
console.log('OIDC-Lab version:', pkg.version)
if (process.argv.length !== 3) {
   usage()
   process.exit(0)
}
if (process.argv[2] === '-v' || process.argv[2] === '--version') {
    process.exit(0)
}
const envPath = process.argv[2].endsWith('.env') ? process.argv[2] : path.join( process.argv[2], '.env' )
if (!existsSync(envPath)) {
    console.error(`File not found: ${envPath}`)
    usage()
    process.exit(1)
}
dotenv.config({ path: envPath })   
run()


async function run()  {
    const mode = getMode()
    await import(`./src/${mode}.js`)
}

function getMode() {
    if (process.env.MODE) {
        if (process.env.MODE !== 'm2m' && mode !== 'oidc') {
            throw new Error("MODE must be 'm2m' or 'oidc'")        
        }
        return process.env.MODE
    }
    if (process.env.SCOPE && process.env.SCOPE.split(' ').includes('openid')) {
        return 'oidc'
    } else {
        return 'm2m'
    } 
} 

function getPackage() {
    try {
        return JSON.parse(readFileSync('./package.json'))
      } catch (err) {
        console.error('Unable to read package.json:', err);
      }
}

function usage() {
    console.log("Usage: node lab <configuration path>[.env]")
}
