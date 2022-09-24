#!/usr/bin/env node
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync
} from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import * as functions from './functions' // improves testability

export function executeCommand (dir: string, template: string): void {
  const fileNames = functions.getAllFiles(dir)
  let numFilesConverted = 0

  fileNames.forEach((filePath) => {
    const fileContent = readFileSync(filePath).toString()
    const hash = functions.getHash(fileContent)

    if (!functions.needsNewTypes(filePath, hash)) {
      return
    }

    const classNames = functions.getClassNames(fileContent)

    writeFileSync(
      `${filePath}.d.ts`,
      template
        .replace('{{hash}}', hash)
        .replace(
          '{{typeDefinition}}',
          functions.getTypeDefinitionString(classNames)
        )
    )
    numFilesConverted++
  })

  console.info(`${numFilesConverted} file(s) changed!\n`)
}

export function getAllFiles (location: string): string[] {
  /* Recursively get all files in the defined directory */
  if (statSync(location).isFile()) {
    return [location]
  }

  let files: string[] = []
  const directoryContent = readdirSync(location).map((entry) =>
    join(location, entry)
  )

  directoryContent.forEach((entry) => {
    const subFiles = functions.getAllFiles(entry)
    files = files.concat(subFiles)
  })

  return files
}

export function getHash (fileContent: string): string {
  return createHash('md5').update(fileContent).digest('hex')
}

export function needsNewTypes (filePath: string, hash: string): boolean {
  const definitionPath = `${filePath}.d.ts`
  if (existsSync(definitionPath)) {
    const definitionContent = readFileSync(definitionPath)
    if (definitionContent.includes(`hash:${hash}`)) {
      return false
    }
  }
  return filePath.endsWith('.module.scss')
}

export function getClassNames (fileContent: string): string[] {
  const classRegex = /\.[a-zA-z0-9]*/g
  const matches = [...fileContent.matchAll(classRegex)]
  const classNames = matches.map((result) => result[0].replace('.', ''))
  return [...new Set(classNames)] // removes duplicates
}

export function getTypeDefinitionString (classes: string[]): string {
  let result = '{\n'
  classes.forEach((className) => {
    result += `\t${className}: string;\n`
  })
  return `${result}}`
}
