import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function execCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execAsync(command, { cwd })
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${(error as Error).message}`)
  }
}

export function expandPath(path: string): string {
  if (path.startsWith('~/')) {
    const home = process.env.HOME || process.env.USERPROFILE || '/home/node'
    return path.replace('~', home)
  }
  return path
}

export function pathRelativeToHome(path: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || '/home/node'
  if (path.startsWith(home)) {
    return path.replace(home, '~')
  }
  return path
}
