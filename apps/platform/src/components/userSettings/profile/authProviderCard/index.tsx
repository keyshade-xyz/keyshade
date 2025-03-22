import type { FunctionComponent, SVGProps } from 'react'

interface AuthProviderCardProps {
    email: string
    isActive: boolean
    provider: string
    icon: FunctionComponent<SVGProps<SVGSVGElement>>
}

export function AuthProviderCard({ provider, email, isActive, icon: Icon }: AuthProviderCardProps): JSX.Element {

    return (
        <div className="w-[372px] p-5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2">
                    <Icon />
                    <span>{provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()}</span>
                </div>
                {isActive ? <span className="w-14 h-5 flex items-center justify-center text-xs text-[#6EE7B7] bg-[#052E16] rounded-md">
                    Active
                </span> : null}
            </div>
            <p className="text-sm mt-2">
                Logged in with <span className="text-blue-300 font-medium">{email}</span>
            </p>
        </div>
    )
}