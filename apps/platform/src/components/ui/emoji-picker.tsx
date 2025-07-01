'use client'

import {
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
  EmojiPicker as EmojiPickerPrimitive
} from 'frimousse'
import { LoaderIcon, SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function EmojiPicker({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Root>) {
  return (
    <EmojiPickerPrimitive.Root
      className={cn(
        'dark isolate flex h-full w-fit flex-col overflow-hidden rounded-md border border-white/20 bg-white/10 text-zinc-200',
        className
      )}
      data-slot="emoji-picker"
      {...props}
    />
  )
}

function EmojiPickerSearch({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Search>) {
  return (
    <div
      className={cn('flex h-9 items-center gap-2 border-b px-3', className)}
      data-slot="emoji-picker-search-wrapper"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <EmojiPickerPrimitive.Search
        className="outline-hidden flex h-10 w-full rounded-md bg-transparent py-3 text-sm placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-zinc-400"
        data-slot="emoji-picker-search"
        {...props}
      />
    </div>
  )
}

function EmojiPickerRow({ children, ...props }: EmojiPickerListRowProps) {
  return (
    <div {...props} className="scroll-my-1 px-1" data-slot="emoji-picker-row">
      {children}
    </div>
  )
}

function EmojiPickerEmoji({
  emoji,
  className,
  ...props
}: EmojiPickerListEmojiProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'flex size-7 items-center justify-center rounded-sm text-base data-[active]:bg-zinc-100 dark:data-[active]:bg-zinc-800',
        className
      )}
      data-slot="emoji-picker-emoji"
    >
      {emoji.emoji}
    </button>
  )
}

function EmojiPickerCategoryHeader({
  category,
  ...props
}: EmojiPickerListCategoryHeaderProps) {
  return (
    <div
      {...props}
      className="bg-white px-3 pb-2 pt-3.5 text-xs leading-none text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400"
      data-slot="emoji-picker-category-header"
    >
      {category.label}
    </div>
  )
}

function EmojiPickerContent({
  className,
  ...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Viewport>) {
  return (
    <EmojiPickerPrimitive.Viewport
      className={cn('outline-hidden relative flex-1', className)}
      data-slot="emoji-picker-viewport"
      {...props}
    >
      <EmojiPickerPrimitive.Loading
        className="absolute inset-0 flex items-center justify-center text-zinc-500 dark:text-zinc-400"
        data-slot="emoji-picker-loading"
      >
        <LoaderIcon className="size-4 animate-spin" />
      </EmojiPickerPrimitive.Loading>
      <EmojiPickerPrimitive.Empty
        className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400"
        data-slot="emoji-picker-empty"
      >
        No emoji found.
      </EmojiPickerPrimitive.Empty>
      <EmojiPickerPrimitive.List
        className="select-none pb-1"
        components={{
          Row: EmojiPickerRow,
          Emoji: EmojiPickerEmoji,
          CategoryHeader: EmojiPickerCategoryHeader
        }}
        data-slot="emoji-picker-list"
      />
    </EmojiPickerPrimitive.Viewport>
  )
}

function EmojiPickerFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'max-w-(--frimousse-viewport-width) flex w-full min-w-0 items-center gap-1 border-t p-2',
        className
      )}
      data-slot="emoji-picker-footer"
      {...props}
    >
      <EmojiPickerPrimitive.ActiveEmoji>
        {({ emoji }) =>
          emoji ? (
            <>
              <div className="flex size-7 flex-none items-center justify-center text-lg">
                {emoji.emoji}
              </div>
              <span className="truncate text-xs text-zinc-900 dark:text-zinc-50">
                {emoji.label}
              </span>
            </>
          ) : (
            <span className="ml-1.5 flex h-7 items-center truncate text-xs text-zinc-500 dark:text-zinc-400">
              Select an emoji…
            </span>
          )
        }
      </EmojiPickerPrimitive.ActiveEmoji>
    </div>
  )
}

export { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter }
