import { Skeleton } from "@/components/ui/skeleton"

export function EnvironmentLoader() {
    return (
        <div className="w-full max-w-md p-6 rounded-lg bg-white/5 text-white space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-9 w-32 rounded-md" />
            </div>

            <Skeleton className="h-5 w-full max-w-xs" />

            <div className="flex flex-col md:flex-row items-center space-x-0 md:space-x-6 pt-2">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-5 w-5" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-5 w-5" />
                </div>
            </div>

            <div className="border-t my-2" />

            <div className="flex flex-col md:flex-row items-center justify-between pt-2">
                <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-36" />
                </div>
                <div className="space-y-1 text-right">
                    <Skeleton className="h-4 w-24 ml-auto" />
                    <Skeleton className="h-5 w-16 ml-auto" />
                </div>
            </div>
        </div>
    )
}