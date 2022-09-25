#!/usr/bin/env node
import { readFileSync } from 'fs'
import { join } from 'path'
import { executeCommand, logHelp } from './functions'

main()

export function main (): void {
  if (process.argv.includes('--help')) {
    logHelp()
    return
  }
  const dir = process.argv[2] ?? '.'
  const renew = process.argv[3] === '--all' || process.argv[3] === '-a'
  const templateLocation = join(__dirname, '../d.ts.template')
  const template = readFileSync(templateLocation).toString()
  executeCommand(dir, template, renew)
}
