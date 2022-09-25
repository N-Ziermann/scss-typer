import { program } from 'commander'
import { executeCommand } from './functions'
import { main } from './index'

jest.mock('./functions', () => ({
  executeCommand: jest.fn()
}))

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('templateText')
}))

jest.mock('commander', () => ({
  program: {
    version: jest.fn().mockReturnThis(),
    usage: jest.fn().mockReturnThis(),
    argument: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    parse: jest.fn().mockReturnThis(),
    args: [],
    opts: jest.fn().mockReturnValue({})
  }
}))

describe('index.ts', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should call executeCommand with the directory and the template', () => {
    program.args = ['/test']
    main()
    expect(executeCommand).toHaveBeenCalledWith('/test', 'templateText', false)
  })

  it('should class executeCommand with renew set to true if -a or --all flag was provided', () => {
    const optsMock = (program.opts as jest.Mock)
    optsMock.mockReturnValueOnce({ all: true })
    program.args = ['/test']
    main()
    expect(executeCommand).toHaveBeenCalledWith('/test', 'templateText', true)
  })
})
