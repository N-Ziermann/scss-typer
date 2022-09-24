#!/usr/bin/env node
import { readFileSync } from 'fs'
import { join } from 'path'
import { executeCommand } from './functions'

main()

export function main (): void {
  const dir = process.argv[2] ?? '.'
  const templateLocation = join(__dirname, '../d.ts.template')
  const template = readFileSync(templateLocation).toString()
  executeCommand(dir, template)
}
