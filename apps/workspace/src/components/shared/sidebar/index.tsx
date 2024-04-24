import Link from 'next/link'
import {
  DashboardSVG,
  IntegrationSVG,
  KeyshadeLogoSVG,
  SettingsSVG,
  TeamSVG
} from '@public/svg/shared'
import { Combobox } from '@/components/ui/combobox'

function Sidebar(): React.JSX.Element {
  return (
    <aside className="m-8 w-[20rem]">
      <div className="grid gap-y-[1.88rem]">
        <div className="mt-5 flex items-center justify-between">
          <div className=" flex gap-2 text-xl">
            {' '}
            <KeyshadeLogoSVG /> Keyshade
          </div>
          <div className="rounded bg-white/10 px-2 py-[0.12rem] text-xs font-bold">
            BETA
          </div>
        </div>
        <Combobox />
        <div className="flex w-full flex-col">
          <Link
            className="flex w-full gap-x-3 rounded-md p-[0.625rem] capitalize transition-colors hover:bg-white/10"
            href="/"
          >
            <DashboardSVG /> Dashboard
          </Link>
          <Link
            className="flex w-full gap-x-3 rounded-md p-[0.625rem] capitalize transition-colors hover:bg-white/10"
            href="/"
          >
            <TeamSVG /> Teams
          </Link>
          <Link
            className="flex w-full gap-x-3 rounded-md p-[0.625rem] capitalize transition-colors hover:bg-white/10"
            href="/"
          >
            <IntegrationSVG /> Integrations
          </Link>
          <Link
            className="flex w-full gap-x-3 rounded-md p-[0.625rem] capitalize transition-colors hover:bg-white/10"
            href="/"
          >
            <SettingsSVG /> Workspace Settings
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
