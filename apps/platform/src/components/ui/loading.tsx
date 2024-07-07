/**
 * Loading Component
 * 
 * This component creates a skeleton representation of a UI structure,
 * followed by rendering actual data after loading. It utilizes utility
 * functions (`cn` for classNames).
 * Uses Skeleton component from  '@/components/ui/skeleton'
 * Props:
 * - className: Additional classNames to apply to the main container.
 * 
 * Features:
 * - Generates 3 rows of skeleton content to mimic the "Key Manager" layout.
 * 
 * Uses:
 * ```
 * @/lib/utils - to create the structure of skeleton.
 * ```
 * Author: Nirajan1-droid
 * Date: 2024-07-08
 */
import * as React from 'react';
import { cn } from '@/lib/utils';  
import { Skeleton } from '@/components/ui/skeleton'; 

const Loading = React.forwardRef<HTMLDivElement>(() => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Here, I have made 3 rows of skeleton to represent on the page. */}
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-xl bg-white/5 px-5 py-4',
            'data-[orientation=vertical]',
          )}
        >
          <div className="flex justify-between">
            <div className="flex gap-x-6 items-center">
              <Skeleton className=" h-8 rounded w-32" />
              <Skeleton className=" h-8 rounded w-8" />
            </div>
            <div className="flex items-center gap-x-3">
              <Skeleton className=" h-6 rounded w-24" />
              <Skeleton className=" h-6 rounded w-16" />
              <Skeleton className=" h-4 rounded w-5 ml-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

// Setting display name for Loading component
Loading.displayName = 'Loading';

export default Loading;

