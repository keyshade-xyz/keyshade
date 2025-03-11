import { useAtomValue } from 'jotai'
import { environmentsOfProjectAtom } from '@/store'
import { Input } from '@/components/ui/input'

interface EnvironmentValueEditorProps {
  environmentValues: Record<string, string>
  setEnvironmentValues: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >
}

export default function EnvironmentValueEditor({
  environmentValues,
  setEnvironmentValues
}: EnvironmentValueEditorProps): React.JSX.Element {
  const environmentsOfProject = useAtomValue(environmentsOfProjectAtom)

  const handleEnvironmentValueChange = (key: string, value: string): void => {
    setEnvironmentValues((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="flex flex-col gap-y-2">
      <span className="font-semibold">Environment Values</span>
      <span className="text-sm text-white/60">
        Manage the values that would be present in the environments.
      </span>

      <div className="mt-2 flex flex-col gap-y-4">
        {environmentsOfProject.map((environment) => (
          <div className="flex flex-row gap-x-4" key={environment.id}>
            <Input type="text" value={environment.name} />
            <Input
              onChange={(e) =>
                handleEnvironmentValueChange(environment.slug, e.target.value)
              }
              type="text"
              value={environmentValues[environment.slug]}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
