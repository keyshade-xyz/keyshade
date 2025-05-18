import { GithubSVG, GoogleSVG, GitlabSVG } from '@public/svg/auth'

const GOOGLE_OAUTH_PATH = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`
const GITHUB_OAUTH_PATH = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/github`
const GITLAB_OAUTH_PATH = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/gitlab`

export const OAUTH_PROVIDER = [
  {
    name: 'Google',
    url: GOOGLE_OAUTH_PATH,
    icon: <GoogleSVG />
  },
  {
    name: 'Github',
    url: GITHUB_OAUTH_PATH,
    icon: <GithubSVG />
  },
  {
    name: 'Gitlab',
    url: GITLAB_OAUTH_PATH,
    icon: <GitlabSVG />
  }
]
