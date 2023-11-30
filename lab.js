import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs';
import dotenv from 'dotenv'

const usage = () => console.log("Usage: node ./app.js <config dir>")

const getMode = () => {
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


if (process.argv.length !== 3) {
   usage()
   process.exit(0)
}

const run = async ({configDirName}) => {
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
run({ configDirName: process.argv[2] })
