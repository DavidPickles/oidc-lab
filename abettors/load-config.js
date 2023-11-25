import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const configDirName = process.argv[2] || process.env.NODE_ENV
if (!configDirName) {
    throw new Error("No config directory: add command line argument or set NODE_ENV")
}
const configPath = path.join(
    dirname(fileURLToPath(import.meta.url)), '../configs', configDirName
)
import dotenv from 'dotenv'
dotenv.config({ path: `${configPath}/.env`})

export default configPath
