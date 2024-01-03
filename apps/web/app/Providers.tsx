'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { neobrutalism, } from '@clerk/themes';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider
            appearance={{
                baseTheme: neobrutalism,
                variables: { colorPrimary: '#0FA7C7' }
            }}
        >
            {children}
        </ClerkProvider>
    )
}