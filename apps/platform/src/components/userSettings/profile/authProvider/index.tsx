import { useAtomValue } from 'jotai'
import React from 'react'
import { EmailWhiteSVG, GoogleWhiteSVG, GithubWhiteSVG, GitlabWhiteSVG } from '@public/svg/auth'
import { AuthProviderCard } from '../authProviderCard'
import { userAtom } from '@/store'

function AuthProvider() {
    const user = useAtomValue(userAtom)
    return (
        <div className="w-fit flex flex-col gap-4">
            <p className="text-xl font-semibold">Login method</p>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    {user?.authProvider === 'EMAIL_OTP' && (
                        <AuthProviderCard
                            email={user.email ?? ''}
                            icon={EmailWhiteSVG}
                            isActive={user.isActive ?? false}
                            provider='Email'
                        />
                    )}
                    {user?.authProvider === 'GOOGLE' && (
                        <AuthProviderCard
                            email={user.email ?? ''}
                            icon={GoogleWhiteSVG}
                            isActive={user.isActive ?? false}
                            provider='Google'
                        />
                    )}
                    {user?.authProvider === 'GITHUB' && (
                        <AuthProviderCard
                            email={user.email ?? ''}
                            icon={GithubWhiteSVG}
                            isActive={user.isActive ?? false}
                            provider='Github'
                        />
                    )}
                    {user?.authProvider === 'GITLAB' && (
                        <AuthProviderCard
                            email={user.email ?? ''}
                            icon={GitlabWhiteSVG}
                            isActive={user.isActive ?? false}
                            provider='Gitlab'
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default AuthProvider
