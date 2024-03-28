#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';
import { executeCommand } from './functions';
import { program } from 'commander';

main();

export function main(): void {
  program
    .version(
      JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))
        .version
    )
    .usage('/path/to/file/or/directory [OPTIONS]')
    .argument('<path>')
    .option(
      '-a, --all',
      "also recreate type definitions for files that didn't change"
    )
    .parse();
  const dir = program.args[0];
  const flags = program.opts();
  const templateLocation = join(__dirname, '../d.ts.template');
  const template = readFileSync(templateLocation).toString();
  executeCommand(dir, template, Boolean(flags.all));
}
