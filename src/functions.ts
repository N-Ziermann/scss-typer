import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import * as functions from './functions'; // import these functions to make it easier to mock them inside a unit test

export function executeCommand(
  dir: string,
  template: string,
  renew: boolean
): void {
  const fileNames = functions.getAllFiles(dir);
  fileNames.forEach((filePath) => {
    const fileContent = readFileSync(filePath).toString();
    const hash = functions.getHash(fileContent);

    if (!functions.needsNewTypes(filePath, hash, renew)) {
      return;
    }

    const classNames = functions.getClassNames(fileContent);

    writeFileSync(
      `${filePath}.d.ts`,
      template
        .replace('{{hash}}', hash)
        .replace(
          '{{typeDefinition}}',
          functions.getTypeDefinitionString(classNames)
        )
    );
  });

  console.info('Done creating files!\n');
}

/**
 * Recursively gets all files in the defined directory
 * */
export function getAllFiles(location: string): string[] {
  if (statSync(location).isFile()) {
    return [location];
  }

  let files: string[] = [];
  const directoryContent = readdirSync(location).map((entry) =>
    join(location, entry)
  );

  directoryContent.forEach((entry) => {
    const subFiles = functions.getAllFiles(entry);
    files = files.concat(subFiles);
  });

  return files;
}

export function getHash(fileContent: string): string {
  return createHash('md5').update(fileContent).digest('hex');
}

/**
 * checks if the defined file needs a new type definition or if there already is an up-to-date one
 * (if renew is set to true, then the function will assume every existing type definition to be out of date)
 */
export function needsNewTypes(
  filePath: string,
  hash: string,
  renew: boolean
): boolean {
  if (filePath.endsWith('.module.scss')) {
    const definitionPath = `${filePath}.d.ts`;
    console.info(definitionPath);
    if (!renew && existsSync(definitionPath)) {
      const definitionContent = readFileSync(definitionPath).toString();
      if (definitionContent.includes(hash)) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export function getClassNames(fileContent: string): string[] {
  const classRegex = /\.-?[_a-zA-Z][_a-zA-Z0-9-]*/g;
  const matches = [...fileContent.matchAll(classRegex)];
  const classNames = matches.map((result) => result[0].replace('.', ''));
  return [...new Set(classNames)];
}

export function getTypeDefinitionString(classes: string[]): string {
  let result = '{\n';
  classes.forEach((className) => {
    const cleanClassName = className.includes('-')
      ? `'${className}'`
      : className;
    result += `\t${cleanClassName}: string;\n`;
  });
  return `${result}}`;
}
