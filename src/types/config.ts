export interface RepoConfig {
  fullName?: string
  repoName?: string
  sshUrl?: string
  httpsUrl?: string
  barePath?: string
  defaultBranch: string
  favorite: boolean
}

export interface CreateRepoData {
  repoName: string
  defaultBranch: string
  worktreeName: string
  worktreeBranchName: string
  favorite: boolean
}

export interface CreateRepoResponse {
  success: boolean
  repo: RepoConfig
  error?: string
}

export interface Config {
  version: number
  paths: {
    bareRoot: string
    worktreeRoot: string
  }
  repos: RepoConfig[]
}
