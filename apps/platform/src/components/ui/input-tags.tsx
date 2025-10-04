'use client'

import type { Dispatch, SetStateAction } from 'react'
import { useId, useState } from 'react'
import type { Tag } from 'emblor'
import { TagInput } from 'emblor'

interface InputTagsProps {
  tags: Tag[]
  setTags: Dispatch<SetStateAction<Tag[]>>
}

export default function InputTags({ tags, setTags }: InputTagsProps) {
  const id = useId()
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)

  return (
    <div className="*:not-first:mt-2">
      <TagInput
        activeTagIndex={activeTagIndex}
        id={id}
        inlineTags={false}
        inputFieldPosition="top"
        placeholder="Add a tag"
        setActiveTagIndex={setActiveTagIndex}
        setTags={(newTags) => {
          setTags(newTags)
        }}
        styleClasses={{
          tagList: {
            container: 'gap-1'
          },
          input:
            'rounded-md transition-[color,box-shadow] placeholder:text-zinc-500/70 focus-visible:border-zinc-950 outline-none focus-visible:ring-[3px] focus-visible:ring-zinc-950/50 dark:placeholder:text-zinc-400/70 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50',
          tag: {
            body: 'relative h-7 bg-white border border-zinc-200 hover:bg-white rounded-md font-medium text-xs ps-2 pe-7 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:bg-zinc-950',
            closeButton:
              'absolute -inset-y-px -end-px p-0 rounded-s-none rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-zinc-950 focus-visible:ring-zinc-950/50 focus-visible:ring-[3px] text-zinc-500/80 hover:text-zinc-950 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50 dark:text-zinc-400/80 dark:hover:text-zinc-50'
          }
        }}
        tags={tags}
      />
    </div>
  )
}
