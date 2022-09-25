import { executeCommand } from './functions'
import { main } from './index'

jest.mock('./functions', () => ({
  executeCommand: jest.fn()
}))

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('templateText')
}))

describe('index.ts', () => {
  beforeEach(() => jest.clearAllMocks())
  it('should call executeCommand with . and the template when no directory is provided', () => {
    global.process.argv = ['node', 'index.js']
    main()
    expect(executeCommand).toHaveBeenCalledWith('.', 'templateText', false)
  })

  it('should call executeCommand with the directory and the template when a directory is provided', () => {
    global.process.argv = ['node', 'index.js', '/test']
    main()
    expect(executeCommand).toHaveBeenCalledWith('/test', 'templateText', false)
  })

  it('should class executeCommand with renew set to true if -a flag was provided', () => {
    global.process.argv = ['node', 'index.js', '/test', '-a']
    main()
    expect(executeCommand).toHaveBeenCalledWith('/test', 'templateText', true)
  })

  it('should class executeCommand with renew set to true if --all flag was provided', () => {
    global.process.argv = ['node', 'index.js', '/test', '--all']
    main()
    expect(executeCommand).toHaveBeenCalledWith('/test', 'templateText', true)
  })
})
