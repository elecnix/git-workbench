import React, { memo, forwardRef, useState, useEffect, useCallback, useRef } from 'react'
import { Worktree } from '@/types/worktrees'
import { usePullRequest } from '../data/usePullRequest'
import { Button } from './ui/Button'
import { DropdownMenu, DropdownMenuItem } from './ui/DropdownMenu'
import { ExternalLink, Copy, GitBranch, MoreVertical, FolderOpen, GitPullRequest } from 'lucide-react'
import { PRNotification } from '@/types/github'
import { CopyLabel } from './CopyLabel'
import clsx from 'clsx'

interface WorktreeRowProps {
  worktree: Worktree
  onDeleteWorktree: (worktree: Worktree) => void
  onCreateFromBranch: (repoName: string, branchName: string) => void
  allPullRequests?: PRNotification[]
  onNavigateToPR?: (prNumber: number, prRepository: string) => void
  isHighlighted?: boolean
  onClearHighlight?: () => void
}

export const WorktreeRow = memo(forwardRef(function WorktreeRow({
  worktree,
  onDeleteWorktree,
  onCreateFromBranch,
  allPullRequests = [],
  onNavigateToPR,
  isHighlighted = false,
  onClearHighlight
}: WorktreeRowProps, ref: React.Ref<HTMLDivElement>) {
  const { pullRequests } = usePullRequest(worktree.repoFullName || '', worktree.branch)
  
  // Animation state for highlight sequence
  const [animationStage, setAnimationStage] = useState(0)
  const animationTimersRef = useRef<NodeJS.Timeout[]>([])
  const isAnimatingRef = useRef(false)
  
  // Animation constants
  const ANIMATION_DURATIONS = {
    STAGE_1: 1000,  // 1 second
    STAGE_2: 2000,  // 2 seconds
    STAGE_3: 3000,  // 3 seconds
    SETTLE: 500     // 0.5 seconds
  } as const
  
  // Clear all animation timers
  const clearAnimationTimers = useCallback(() => {
    animationTimersRef.current.forEach(timer => clearTimeout(timer))
    animationTimersRef.current = []
  }, [])
  
  // Handle animation sequence when highlighted
  useEffect(() => {
    if (isHighlighted && !isAnimatingRef.current) {
      isAnimatingRef.current = true
      setAnimationStage(1)
      
      // Stage 1: 1 second pulse
      const timer1 = setTimeout(() => {
        setAnimationStage(2)
      }, ANIMATION_DURATIONS.STAGE_1)
      
      // Stage 2: 2 second pulse
      const timer2 = setTimeout(() => {
        setAnimationStage(3)
      }, ANIMATION_DURATIONS.STAGE_1 + ANIMATION_DURATIONS.STAGE_2)
      
      // Stage 3: 3 second pulse
      const timer3 = setTimeout(() => {
        setAnimationStage(4)
        isAnimatingRef.current = false
      }, ANIMATION_DURATIONS.STAGE_1 + ANIMATION_DURATIONS.STAGE_2 + ANIMATION_DURATIONS.STAGE_3)
      
      animationTimersRef.current = [timer1, timer2, timer3]
    } else if (!isHighlighted) {
      // Reset animation state when not highlighted
      clearAnimationTimers()
      setAnimationStage(0)
      isAnimatingRef.current = false
    }
    
    return clearAnimationTimers
  }, [isHighlighted, clearAnimationTimers])
  
  const matchingPR = allPullRequests.find(pr => 
    pr.headRef === worktree.branch && 
    pr.repository.toLowerCase() === (worktree.repoFullName || '').toLowerCase()
  )

  const handleOpenInGitHub = useCallback(() => {
    if (worktree.repoFullName) {
      const url = `https://github.com/${worktree.repoFullName}/tree/${worktree.branch}`
      window.open(url, '_blank')
    }
  }, [worktree.repoFullName, worktree.branch])

  const handleOpenInWindsurf = useCallback(() => {
    const url = `windsurf://file/${encodeURIComponent(worktree.path)}`
    window.open(url, '_blank')
  }, [worktree.path])

  const handleDeleteWorktree = useCallback(() => {
    onDeleteWorktree(worktree)
  }, [worktree, onDeleteWorktree])

  const handleCreateFromBranch = useCallback(() => {
    const repoName = worktree.repoFullName || worktree.repoName
    onCreateFromBranch(repoName, worktree.branch)
  }, [worktree, onCreateFromBranch])

  const handleNavigateToPR = useCallback(() => {
    if (matchingPR && onNavigateToPR) {
      onNavigateToPR(matchingPR.number, matchingPR.repository)
    }
  }, [matchingPR, onNavigateToPR])

  // Extract worktree name from path (last directory name)
  const worktreeName = worktree.pathRelativeToHome 
    ? worktree.pathRelativeToHome.split('/').pop() || worktree.pathRelativeToHome
    : 'Unknown Worktree'

  const isDirty = worktree.status && (
    worktree.status.staged > 0 || 
    worktree.status.modified > 0 || 
    worktree.status.untracked > 0 || 
    worktree.status.outgoing > 0
  )

  // Determine animation class based on stage (memoized for performance)
  const getAnimationClass = useCallback(() => {
    if (!isHighlighted) return ''
    switch (animationStage) {
      case 1: return 'animate-worktree-highlight-1'
      case 2: return 'animate-worktree-highlight-2'
      case 3: return 'animate-worktree-highlight-3'
      case 4: return 'animate-worktree-highlight-settle'
      default: return ''
    }
  }, [isHighlighted, animationStage])

  return (
    <div ref={ref} className={clsx(
      'border-b p-4 hover:bg-muted/50 transition-colors',
      isHighlighted && 'worktree-highlight-permanent dark:worktree-highlight-permanent-dark',
      getAnimationClass()
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenInGitHub}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Open in GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-medium" title={worktree.pathRelativeToHome}>
                  {worktreeName}
                </span>
                
                {worktree.status && (
                  <div className="flex items-center space-x-2 text-xs">
                    {worktree.status.staged > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        staged: {worktree.status.staged}
                      </span>
                    )}
                    {worktree.status.modified > 0 && (
                      <span className="text-orange-600 dark:text-orange-400">
                        modified: {worktree.status.modified}
                      </span>
                    )}
                    {worktree.status.untracked > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        untracked: {worktree.status.untracked}
                      </span>
                    )}
                    {worktree.status.incoming > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        ↓{worktree.status.incoming}
                      </span>
                    )}
                    {worktree.status.outgoing > 0 && (
                      <span className="text-purple-600 dark:text-purple-400">
                        ↑{worktree.status.outgoing}
                      </span>
                    )}
                    {!isDirty && (
                      <span className="text-green-600 dark:text-green-400">
                        clean
                      </span>
                    )}
                    {matchingPR && (
                      <button
                        onClick={handleNavigateToPR}
                        className="text-green-500 hover:text-green-600 transition-colors"
                        title={`Go to PR #${matchingPR.number}`}
                      >
                        <GitPullRequest className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
                
                {isHighlighted && onClearHighlight && (
                  <button
                    onClick={onClearHighlight}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors text-xs"
                    title="Clear highlight"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-1 mt-1">
                <CopyLabel 
                  text={worktree.branch} 
                  className="text-sm text-muted-foreground"
                  title="Copy branch name"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            {pullRequests.length > 0 && (
              <div className="flex items-center space-x-2">
                {pullRequests.map((pr) => (
                  <a
                    key={pr.number}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      'text-xs px-2 py-1 rounded',
                      pr.state === 'OPEN' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : pr.state === 'MERGED'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    )}
                  >
                    #{pr.number}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenInWindsurf}
            title={worktree.path}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Open
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCreateFromBranch}
          >
            Create from this branch
          </Button>
          
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            }
          >
            <DropdownMenuItem onClick={handleDeleteWorktree}>
              Delete
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}))
