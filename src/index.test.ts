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
    main()
    expect(executeCommand).toHaveBeenCalledWith('.', 'templateText')
  })

  it('should call executeCommand with the directory and the template when a directory is provided', () => {
    global.process.argv = ['node', 'index.js', '/test']
    main()
    expect(executeCommand).toHaveBeenCalledWith('/test', 'templateText')
  })
})
