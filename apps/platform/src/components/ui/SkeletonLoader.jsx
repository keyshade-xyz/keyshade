/**
 * SkeletonLoader Component
 * 
 * 
 * This component creates a skeleton representation of a UI structure,
 * followed by rendering actual data after loading. It utilizes utility
 * functions (`cn` for classNames) and SVG icons for graphical elements.
 * 
 * Features:
 * - Generates 5 rows of skeleton content.
 * - Toggles between open and closed states for each row to simulate data loading.
 * - Provides accessibility attributes like aria-expanded and aria-controls.
 * - Animates the accordion-like expansion and collapse of content.
 * 
 * Uses:
 * ```
 * @/lib/utils - to create the structure of skeleton.
 * ```
 * Author: Nirajan1-droid 
 * Date: 2024-07-07
 */


import * as React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils'; // Import utility function for classNames

 
const SkeletonLoader = React.forwardRef<HTMLDivElement>(() => {
  const [isOpen, setIsOpen] = useState(false); // State to manage open/close state
/**
 * the skeleton is responsive. it can be toggled(open/closed) 
 */
  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Here, I have made 5 rows of skeleton to represent on the page. */}
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-xl bg-white/5 px-5',
            isOpen ? 'data-[state=open]' : 'data-[state=closed]', // Toggle open/closed state
            'data-[orientation=vertical]', // Add required data attributes
           // Include any additional classNames that are passed as props
          )}
         
        
        >
          <h3
            className={cn(
              'flex',
              'data-[orientation=vertical]',
              isOpen ? 'data-[state=open]' : 'data-[state=closed]' // Toggles open/closed state for h3
            )}
          >
            <button
              type="button"
              aria-controls={`radix-${index}`}
              aria-expanded={isOpen ? 'true' : 'false'}  
              className={cn(
                'flex flex-1 items-center justify-between py-4 font-medium transition-all',
                '[&[data-state=open]>svg]:rotate-180 hover:no-underline'
              )}
              data-state={isOpen ? 'open' : 'closed'} 
              data-orientation="vertical"
              id={`radix-${index}`}
              data-radix-collection-item=""
              onClick={toggleAccordion} // Toggles accordion on button click
            >
              <div className="flex gap-x-5">
                <div className="flex items-center gap-x-4">
            
                  <div className="bg-gray-400 h-4 rounded w-16"></div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 40 40"
                  className="w-7"
                >
                  <path
                    stroke="#FFF8F8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.59"
                    strokeWidth="2"
                    d="M35.417 12.51v11.012a6.605 6.605 0 0 1-6.607 6.608h-4.405l-3.634 3.633a1.06 1.06 0 0 1-1.541 0l-3.633-3.633h-4.409a6.607 6.607 0 0 1-6.606-6.608V12.51a6.607 6.607 0 0 1 6.606-6.607h17.62a6.607 6.607 0 0 1 6.608 6.607"
                  ></path>
                  <path
                    stroke="#FFF8F8"
                    strokeLinecap="round"
                    strokeMiterlimit="10"
                    strokeOpacity="0.59"
                    strokeWidth="2"
                    d="M14.098 18.117h11.803"
                  ></path>
                </svg>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-xs text-white/50">
              
                  <div className="bg-gray-400 h-4 rounded w-20"></div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-down h-4 w-4 shrink-0 transition-transform duration-200"
                >
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </div>
            </button>
          </h3>
          <div
            id={`radix-${index}`}
            data-state={isOpen ? 'open' : 'closed'}  
            role="region"
            aria-labelledby={`radix-${index}`}
            data-orientation="vertical"
            className={cn(
              isOpen ? 'animate-accordion-down' : 'animate-accordion-up',
              'overflow-hidden text-sm transition-all'
            )}
            hidden={!isOpen} 
          >
        {/* Set colors of skeleton */}
            <div className="bg-gray-200 h-10 rounded"></div>
            <div className="bg-gray-200 h-10 rounded mt-2"></div>
            <div className="bg-gray-200 h-10 rounded mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );
});

// Setting display name for SkeletonLoader component
SkeletonLoader.displayName = 'SkeletonLoader';


export default SkeletonLoader;
