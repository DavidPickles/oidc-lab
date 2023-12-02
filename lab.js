import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv'

console.log('OIDC-Lab version:', getVersion())
if (process.argv.length !== 3) {
   usage()
   process.exit(0)
}
if (process.argv[2] === '-v' || process.argv[2] === '--version') {
    process.exit(0)
}
run({ configDirName: process.argv[2] })


async function run({configDirName})  {
    const configPath = path.join(
        dirname(fileURLToPath(import.meta.url)), './configs', configDirName
    )
    if (!existsSync(configPath)) {
        console.error(`No directory: ${configPath}`)
        usage()
        return
    }
    dotenv.config({ path: `${configPath}/.env`})   
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

function getVersion() {
    try {
      return JSON.parse(readFileSync('./package.json')).version
    } catch (err) {
      console.error('Unable to read package.json:', err);
    }
}

function usage() {
    console.log("Usage: node ./app.js <config dir>")
}
