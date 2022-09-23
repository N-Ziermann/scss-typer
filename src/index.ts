#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

const dir = process.argv[2] ?? '.'
const templateLocation = join(__dirname, '../d.ts.template')
const template = readFileSync(templateLocation)?.toString()

executeCommand()

function executeCommand (): void {
  const fileNames = getAllFiles(dir)
  let numFilesConverted = 0

  fileNames.forEach((filePath) => {
    const fileContent = readFileSync(filePath).toString()
    const hash = getHash(fileContent)

    if (!needsNewTypes(filePath, hash)) {
      return
    }

    writeFileSync(
      `${filePath}.d.ts`,
      template
        .replace('{{hash}}', hash)
        .replace('{{typeDefinition}}', getTypeDefinitionString(fileContent))
    )
    numFilesConverted++
  })

  console.info(`${numFilesConverted} file(s) changed!\n`)
}

function getAllFiles (location: string): string[] {
  /* Recursively get all files in the defined directory */
  const directoryContent = readdirSync(location).map(entry => join(location, entry))
  const subDirectories: string[] = []
  let files: string[] = []

  directoryContent.forEach(entry => {
    const entryData = statSync(entry)
    if (entryData.isFile()) {
      files.push(entry)
    } else if (entryData.isDirectory()) {
      subDirectories.push(entry)
    }
  })

  subDirectories.forEach(sub => {
    const test = getAllFiles(sub)
    files = files.concat(test)
  })

  return files
}

function getHash (fileContent: string): string {
  return createHash('md5').update(fileContent).digest('hex')
}

function needsNewTypes (filePath: string, hash: string): boolean {
  // TODO: also read and compare hash stored in existing file here
  const definitionPath = `${filePath}.d.ts`
  if (existsSync(definitionPath)) {
    const definitionContent = readFileSync(definitionPath)
    if (definitionContent.includes(`hash:${hash}`)) {
      return false
    }
  }
  return filePath.endsWith('.module.scss')
}

function getClassNames (fileContent: string): string[] {
  const classRegex = /\.[a-zA-z0-9]*/g
  const matches = [...fileContent.matchAll(classRegex)]
  return matches.map(result => result[0].replace('.', ''))
}

function getTypeDefinitionString (fileContent: string): string {
  const classes = getClassNames(fileContent)
  let result = '{\n'
  classes.forEach(className => {
    result += `\t${className}: string;\n`
  })
  return `${result}}`
}
