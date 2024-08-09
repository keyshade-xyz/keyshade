
import * as React from 'react';
import { cn } from '@/lib/utils';  
import { Skeleton } from '@/components/ui/skeleton'; 

const Loading(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4">
    
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="data-[orientation=vertical] rounded-xl bg-white/5 px-5 py-4"
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
 
 
export default Loading;

