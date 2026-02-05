import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type Tab = 'repositories' | 'favorites' | 'worktrees' | 'pull-requests'

export function useAppNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<Tab>('favorites')
  const [searchQuery, setSearchQuery] = useState('')
  const isInitialMount = useRef(true)

  // Get tab from pathname
  const getTabFromPathname = (path: string): Tab => {
    if (path.includes('/repositories')) return 'repositories'
    if (path.includes('/favorites')) return 'favorites'
    if (path.includes('/worktrees')) return 'worktrees'
    if (path.includes('/pull-requests')) return 'pull-requests'
    return 'favorites'
  }

  // Sync tab from pathname after mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialMount.current) {
      const tab = getTabFromPathname(pathname)
      setActiveTab(tab)
      isInitialMount.current = false
    }
  }, [pathname])

  // Update URL when tab changes (but not on initial mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialMount.current) {
      router.push(`/${activeTab}`, { scroll: false })
    }
  }, [activeTab, router])

  const jumpToRepo = useCallback((repoName: string) => {
    setActiveTab('worktrees')
    setSearchQuery('')
    router.push('/worktrees', { scroll: false })
  }, [router])

  const jumpToWorktrees = useCallback(() => {
    setActiveTab('worktrees')
    router.push('/worktrees', { scroll: false })
  }, [router])

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    jumpToRepo,
    jumpToWorktrees
  }
}
