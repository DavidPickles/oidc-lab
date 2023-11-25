import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs';
import dotenv from 'dotenv'

const usage = () => console.log("Usage: node ./lab.js oidc|m2m <config dir>")

if (process.argv.length !== 4) {
   usage()
   process.exit(1)
}

const mode = process.argv[2]
if (mode !== 'm2m' && mode !== 'oidc') {
    usage()
    process.exit(1)
 }

const configDirName = process.argv[3]
const configPath = path.join(
    dirname(fileURLToPath(import.meta.url)), './configs', configDirName
)
if (!existsSync(configPath)) {
    console.error(`No directory: ${configPath}`)
    usage()
    process.exit(1)
}

dotenv.config({ path: `${configPath}/.env`})

const run = async () => {
    const module = {m2m: "./src/client-creds.js", oidc: "./src/server.js" }
    await import(module[mode])
}
run()
