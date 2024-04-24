import ProjectCard from '@/components/dashboard/projectCard'

export default function Index(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[1.75rem] font-semibold 2xl:mt-16">My Projects</h1>
      <div className="grid h-[70vh] gap-6 overflow-y-auto scroll-smooth p-2 md:grid-cols-2 2xl:grid-cols-3">
        <ProjectCard />
        <ProjectCard />
      </div>
    </div>
  )
}
