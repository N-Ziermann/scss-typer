#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const dir = process.argv[2] ?? '.'
const templateLocation = path.join(__dirname, './d.ts.template')
const template = fs.readFileSync(templateLocation)?.toString()

executeCommand()

function executeCommand () {
  const fileNames = getAllFiles(dir)
  let numFilesConverted = 0

  fileNames.forEach((filePath) => {
    const fileContent = fs.readFileSync(filePath).toString()
    const hash = getHash(fileContent)

    if (!needsNewTypes(filePath, hash)) {
      return
    }

    fs.writeFileSync(
      `${filePath}.d.ts`,
      template
        .replace('{{hash}}', hash)
        .replace('{{typeDefinition}}', getTypeDefinitionString(fileContent))
    )
    numFilesConverted++
  })

  console.info(`${numFilesConverted} file(s) changed!\n`)
}

function getAllFiles (location) {
  /* Recursively get all files in the defined directory */
  const directoryContent = fs.readdirSync(location).map(entry => path.join(location, entry))
  const subDirectories = []
  let files = []

  directoryContent.forEach(entry => {
    const entryData = fs.statSync(entry)
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

function getHash (fileContent) {
  return crypto.createHash('md5').update(fileContent).digest('hex')
}

function needsNewTypes (filePath, hash) {
  // TODO: also read and compare hash stored in existing file here
  const definitionPath = `${filePath}.d.ts`
  if (fs.existsSync(definitionPath)) {
    const definitionContent = fs.readFileSync(definitionPath)
    if (definitionContent.includes(`hash:${hash}`)) {
      return false
    }
  }
  return filePath.endsWith('.module.scss')
}

function getClassNames (fileContent) {
  const classRegex = /\.[a-zA-z0-9]*/g
  const matches = [...fileContent.matchAll(classRegex)]
  return matches.map(result => result[0].replace('.', ''))
}

function getTypeDefinitionString (fileContent) {
  const classes = getClassNames(fileContent)
  let result = '{\n'
  classes.forEach(className => {
    result += `\t${className}: string;\n`
  })
  return `${result}}`
}
