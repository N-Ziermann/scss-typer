import * as functions from './functions'
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync
} from 'fs'

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(''),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest
    .fn()
    .mockReturnValue({ isFile: jest.fn(), isDirectory: jest.fn() }),
  existsSync: jest.fn()
}))

const template = JSON.stringify({
  hash: '{{hash}}',
  typeDefinition: '{{typeDefinition}}'
})

const scssFileContent = `
.classA {
    width: 20px;
    .classB {
        height: 21rem;
    }
}
  
.class3 {
    display: flex;
    .class4 {
        padding: 1px 2rem 3cm 4em;
    }
}  
`

describe('functions.ts', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('executeCommand', () => {
    it('should not create any files if no module.scss files are found', () => {
      jest.spyOn(functions, 'getAllFiles').mockReturnValueOnce([])
      functions.executeCommand('.', template, false)
      expect(writeFileSync).not.toHaveBeenCalled()
      expect(readFileSync).not.toHaveBeenCalled()
    })

    it('should create a definition file if a module.scss files that needs a definition', () => {
      jest
        .spyOn(functions, 'getAllFiles')
        .mockReturnValueOnce(['a.module.scss'])
      jest.spyOn(functions, 'needsNewTypes').mockReturnValueOnce(true)
      functions.executeCommand('.', template, false)
      expect(readFileSync).toHaveBeenCalled()
      expect(writeFileSync).toHaveBeenCalled()
    })

    it('should not create a definition file for a module.scss files that doesnt need a definition', () => {
      jest
        .spyOn(functions, 'getAllFiles')
        .mockReturnValueOnce(['a.module.scss'])
      jest.spyOn(functions, 'needsNewTypes').mockReturnValueOnce(false)
      functions.executeCommand('.', template, false)
      expect(readFileSync).toHaveBeenCalled()
      expect(writeFileSync).not.toHaveBeenCalled()
    })
  })

  describe('getAllFiles', () => {
    it('should return directly if a filepath was given as a parameter', () => {
      (statSync as jest.Mock).mockReturnValueOnce({
        isFile: jest.fn().mockReturnValueOnce(true),
        isDirectory: jest.fn().mockReturnValueOnce(false)
      })
      const fileName = './a.module.scss'
      expect(functions.getAllFiles(fileName)).toEqual([fileName])
    })

    it('should call itself for any file inside the given directory', () => {
      const statMock = statSync as jest.Mock
      const readdirMock = readdirSync as jest.Mock

      statMock.mockImplementation((location: string) => ({
        isFile: jest.fn().mockReturnValue(location.includes('.module.scss')),
        isDirectory: jest
          .fn()
          .mockReturnValue(!location.includes('.module.scss'))
      }))
      readdirMock
        .mockReturnValue(['file.module.scss'])
        .mockReturnValueOnce(['a', 'b', 'c'])

      expect(functions.getAllFiles('/')).toEqual([
        '/a/file.module.scss',
        '/b/file.module.scss',
        '/c/file.module.scss'
      ])
    })
  })

  describe('getClassNames', () => {
    it('should return a list of all classNames', () => {
      const classNames = functions.getClassNames(scssFileContent)
      expect(classNames).toEqual(['classA', 'classB', 'class3', 'class4'])
    })

    it('should not return a className twice', () => {
      const classNames = functions.getClassNames(
        '.classA {margin: 2rem;} .classA {margin: 3rem;}'
      )
      expect(classNames).toHaveLength(1)
    })

    it('should not recognize floats as classes', () => {
      const classNames = functions.getClassNames(
        '.classA {margin: 2.5rem;}'
      )
      expect(classNames).toEqual(['classA'])
    })
  })

  describe('getTypeDefinitionString', () => {
    it('should convert a className object into a typeDefinition', () => {
      const definition = functions.getTypeDefinitionString([
        'classA',
        'classB'
      ])
      expect(definition).toEqual('{\n\tclassA: string;\n\tclassB: string;\n}')
    })

    it('should convert a className with a dash object into a typeDefinition in string form', () => {
      const definition = functions.getTypeDefinitionString([
        'width-dash',
        'classB'
      ])
      expect(definition).toEqual('{\n\t\'width-dash\': string;\n\tclassB: string;\n}')
    })
  })

  describe('needsNewTypes', () => {
    it('should return false if the given file has a type definition with the same hash', () => {
      const hash = 'abc1234'
      const existsMock = existsSync as jest.Mock
      const readFileMock = readFileSync as jest.Mock
      existsMock.mockReturnValueOnce(true)
      readFileMock.mockReturnValueOnce(`hash:${hash}`)

      const result = functions.needsNewTypes('./test.module.scss', hash, false)
      expect(result).toBeFalsy()
    })

    it('should return true if the given file has no type definition yet', () => {
      const hash = 'abc1234'
      const existsMock = existsSync as jest.Mock
      existsMock.mockReturnValueOnce(false)

      const result = functions.needsNewTypes('./test.module.scss', hash, false)
      expect(result).toBeTruthy()
    })

    it('should return true if the given file has a type definition with another hash', () => {
      const hash1 = 'abc1234'
      const hash2 = 'cba6895'
      const existsMock = existsSync as jest.Mock
      const readFileMock = readFileSync as jest.Mock
      existsMock.mockReturnValueOnce(true)
      readFileMock.mockReturnValueOnce(`hash:${hash1}`)

      const result = functions.needsNewTypes('./test.module.scss', hash2, false)
      expect(result).toBeTruthy()
    })

    it('should always recreate type definitions when renew is set to true', () => {
      const hash = 'abc1234'
      const existsMock = existsSync as jest.Mock
      const readFileMock = readFileSync as jest.Mock
      existsMock.mockReturnValueOnce(true)
      readFileMock.mockReturnValueOnce(`hash:${hash}`)

      const result = functions.needsNewTypes('./test.module.scss', hash, true)
      expect(result).toBeTruthy()
    })

    it('should always return false if the given file is not a .module.scss file', () => {
      const existsMock = existsSync as jest.Mock
      const readFileMock = readFileSync as jest.Mock
      existsMock.mockReturnValueOnce(true)
      readFileMock.mockReturnValueOnce('hash:a')

      const result = functions.needsNewTypes('./test.js', 'a', true)
      expect(result).toBeFalsy()
    })
  })

  describe('getHash', () => {
    it('should return a hex md5 hash of the given file', () => {
      expect(functions.getHash('abcdefg')).toEqual(
        '7ac66c0f148de9519b8bd264312c4d64'
      )
    })
  })
})
