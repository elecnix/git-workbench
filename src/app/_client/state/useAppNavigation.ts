import { useState, useCallback, useEffect, useRef } from 'react'

export type Tab = 'repositories' | 'favorites' | 'worktrees' | 'pull-requests'

export function useAppNavigation() {
  const [activeTab, setActiveTab] = useState<Tab>('favorites')
  const [searchQuery, setSearchQuery] = useState('')
  const isInitialMount = useRef(true)

  // Sync tab from URL after mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialMount.current) {
      const hash = window.location.hash.slice(1)
      if (hash === 'repositories' || hash === 'favorites' || hash === 'worktrees' || hash === 'pull-requests') {
        setActiveTab(hash as Tab)
      }
      isInitialMount.current = false
    }
  }, [])

  // Update URL fragment when tab changes (but not on initial mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialMount.current) {
      const newHash = `#${activeTab}`
      window.history.replaceState(null, '', newHash)
    }
  }, [activeTab])

  // Listen for browser back/forward to sync tab state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'repositories' || hash === 'favorites' || hash === 'worktrees' || hash === 'pull-requests') {
        setActiveTab(hash as Tab)
      } else if (!hash) {
        setActiveTab('favorites')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange)
      return () => window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const jumpToRepo = useCallback((repoName: string) => {
    setActiveTab('worktrees')
    setSearchQuery('')
    // In a real implementation, we might store the target repo for scrolling
  }, [])

  const jumpToWorktrees = useCallback(() => {
    setActiveTab('worktrees')
  }, [])

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    jumpToRepo,
    jumpToWorktrees
  }
}
