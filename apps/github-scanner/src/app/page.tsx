import RepoInput from '@/components/repo-input'

export default function Home() {
  return (
    <div className="m-4 grid min-h-screen items-center">
      <div className="grid justify-items-center gap-8">
        <h1 className="text-2xl dark:text-green-400">GitHub Scan</h1>
        <RepoInput />
      </div>
    </div>
  )
}
