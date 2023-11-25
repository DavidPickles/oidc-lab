import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs';
import dotenv from 'dotenv'

const usage = () => console.log("Usage: node ./app.js <config dir>")

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
    const mode = process.env.MODE
    if (mode !== 'm2m' && mode !== 'oidc') {
        console.error("No MODE in .env file")
        return
    }    
    await import(`./src/${mode}.js`)
}
run({ configDirName: process.argv[2] })
