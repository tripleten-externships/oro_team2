import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

function collectFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = resolve(directory, entry)
    return statSync(fullPath).isDirectory() ? collectFiles(fullPath) : [fullPath]
  })
}

function createAmplifyFileMap(directory) {
  const root = resolve(directory)
  return Object.fromEntries(collectFiles(root).map((filePath) => [
    relative(root, filePath).split(sep).join('/'),
    createHash('md5').update(readFileSync(filePath)).digest('hex'),
  ]))
}

const directory = process.argv[2]
if (!directory) {
  throw new Error('Usage: node create-amplify-file-map.mjs <directory>')
}

process.stdout.write(JSON.stringify(createAmplifyFileMap(directory)))

export { createAmplifyFileMap }
