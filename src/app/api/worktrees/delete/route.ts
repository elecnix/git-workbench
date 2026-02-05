import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import { execCommand, expandPath } from '@/lib/git'
import { getWorktreeStatus } from '@/lib/worktree'
import { DeleteWorktreeRequest } from '@/types/worktrees'

export async function POST(request: NextRequest) {
  try {
    const { repo, worktreePath, force }: DeleteWorktreeRequest & { force?: boolean } = await request.json()

    if (!repo || !worktreePath) {
      return NextResponse.json(
        { error: 'repo and worktreePath are required' },
        { status: 400 }
      )
    }

    const config = await getConfig()
    
    // Find the repo in config
    const repoConfig = config.repos.find(r => 
      r.fullName === repo || r.repoName === repo
    )

    if (!repoConfig) {
      return NextResponse.json(
        { error: 'Repository not found in configuration' },
        { status: 404 }
      )
    }

    const repoName = repoConfig.repoName || repoConfig.fullName!.split('/')[1]
    const barePath = repoConfig.barePath || `${expandPath(config.paths.bareRoot)}/${repoName}.git`

    // Get worktree status to check if it's clean
    const status = await getWorktreeStatus(worktreePath)
    const isClean = status.staged === 0 && status.modified === 0 && status.untracked === 0 && status.outgoing === 0

    if (!isClean && !force) {
      return NextResponse.json({
        error: 'Worktree is not clean',
        status,
        requiresConfirmation: true
      }, { status: 409 })
    }

    // Delete the worktree (use --force flag if worktree is not clean)
    const forceFlag = !isClean ? '--force' : ''
    await execCommand(`git --git-dir "${barePath}" worktree remove ${forceFlag} "${worktreePath}"`)

    return NextResponse.json({ 
      message: 'Worktree deleted successfully',
      wasClean: isClean
    })
  } catch (error) {
    console.error('Failed to delete worktree:', error)
    return NextResponse.json(
      { error: `Failed to delete worktree: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
