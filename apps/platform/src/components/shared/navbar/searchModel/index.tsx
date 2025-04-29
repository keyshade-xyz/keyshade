'use client'
import type { Dispatch, SetStateAction } from 'react'
import React, { useEffect, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { useAtom, useAtomValue } from 'jotai'
import type { WorkspaceWithTierLimitAndProjectCount } from '@keyshade/schema'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDownSVG, ArrowUpSVG, SelectSVG } from '@public/svg/shared'
import {
  EnvironmentSVG,
  FolderSVG,
  SecretSVG,
  VariableSVG
} from '@public/svg/dashboard'
import type { CommandDialogProps } from '@/components/ui/command'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '@/components/ui/command'
import {
  globalSearchDataAtom,
  selectedProjectAtom,
  selectedWorkspaceAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchModelProps extends CommandDialogProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

// Define search options for each data type
/**
 * includeScore: Whether to include the search score in the results (0 = perfect match, 1 = bad match)
 * threshold: How strict the matching should be (0 = exact, 1 = very loose)
 * keys: Which fields to search within
 */
const searchOptions = {
  includeScore: true,
  threshold: 0.3,
  keys: ['note', 'name', 'description', 'slug']
}

function SearchModel({
  isOpen,
  setIsOpen,
  ...props
}: SearchModelProps): React.JSX.Element {
  const router = useRouter()

  const [globalSearchData, setGlobalSearchData] = useAtom(globalSearchDataAtom)
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )
  const selectedProject = useAtomValue(selectedProjectAtom)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [hasNoResults, setHasNoResults] = useState<boolean>(false)

  const getGlobalSearchData = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.globalSearch({
      workspaceSlug: selectedWorkspace!.slug,
      search: searchQuery
    })
  )

  // Initialize Fuse instances for each data type
  const fuseInstances = useMemo(
    () => ({
      workspaces: new Fuse(globalSearchData.workspaces, searchOptions),
      secrets: new Fuse(globalSearchData.secrets, searchOptions),
      projects: new Fuse(globalSearchData.projects, searchOptions),
      environments: new Fuse(globalSearchData.environments, searchOptions),
      variables: new Fuse(globalSearchData.variables, searchOptions)
    }),
    [globalSearchData]
  )

  // Search for results based on the current search query
  const searchResults = useMemo(() => {
    if (!searchQuery) {
      return globalSearchData
    }

    return {
      workspaces: fuseInstances.workspaces
        .search(searchQuery)
        .map((result) => result.item),
      secrets: fuseInstances.secrets
        .search(searchQuery)
        .map((result) => result.item),
      projects: fuseInstances.projects
        .search(searchQuery)
        .map((result) => result.item),
      environments: fuseInstances.environments
        .search(searchQuery)
        .map((result) => result.item),
      variables: fuseInstances.variables
        .search(searchQuery)
        .map((result) => result.item)
    }
  }, [searchQuery, fuseInstances, globalSearchData])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const debouncedSetValue = useDebounce((value: string) => {
    setDebouncedValue(value)
  }, 500)

  // Check if there are no results after search
  useEffect(() => {
    const noResults = Object.values(searchResults).every(
      (results: unknown) => Array.isArray(results) && results.length === 0
    )
    setHasNoResults(noResults && searchQuery.length > 0)
  }, [searchResults, searchQuery])

  // Handle API search
  useEffect(() => {
    if (hasNoResults && debouncedValue) {
      getGlobalSearchData().then(({ data, success }) => {
        if (success && data) {
          const newData = {
            workspaces: [],
            secrets: data.secrets,
            projects: data.projects,
            environments: data.environments,
            variables: data.variables
          }
          setGlobalSearchData(newData)
        }
      })
    }
  }, [debouncedValue, getGlobalSearchData, setGlobalSearchData, hasNoResults])

  // Update the search results when the search query changes
  useEffect(() => {
    debouncedSetValue(searchQuery)
  }, [debouncedSetValue, searchQuery])

  const handleChangeWorkspace = (
    workspace: WorkspaceWithTierLimitAndProjectCount
  ) => {
    const newWorkspace = { ...workspace, projects: 0 }
    setSelectedWorkspace(newWorkspace)
    router.push('/')
  }

  return (
    <CommandDialog onOpenChange={setIsOpen} open={isOpen} {...props}>
      <CommandInput
        onValueChange={handleSearch}
        placeholder="Search by name, slug or description"
        value={searchQuery}
      />
      <CommandList>
        {hasNoResults ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <>
            {searchResults.workspaces.length > 0 && (
              <>
                <CommandGroup heading="WORKSPACES">
                  {searchResults.workspaces.map((workspace) => (
                    <CommandItem
                      key={workspace.id}
                      onClick={() => {
                        handleChangeWorkspace(
                          workspace as WorkspaceWithTierLimitAndProjectCount
                        )
                        setIsOpen(false)
                      }}
                    >
                      <span className="mr-2">{workspace.icon}</span>
                      <span>{workspace.name}</span>
                      {workspace.slug ? (
                        <span className="ml-2 text-sm text-gray-200">
                          ({workspace.slug})
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {searchResults.projects.length > 0 && (
              <>
                <CommandGroup heading="PROJECTS">
                  {searchResults.projects.map((project) => (
                    <Link
                      href={`/${selectedWorkspace!.slug}/${project.slug}?tab=secret`}
                      key={project.slug}
                      onClick={() => setIsOpen(false)}
                    >
                      <CommandItem key={project.slug}>
                        <FolderSVG className="mr-1 h-4 w-4" />
                        <span>{project.slug}</span>
                        {project.description ? (
                          <span className="ml-2 text-sm text-gray-200">
                            {project.description}
                          </span>
                        ) : null}
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {searchResults.secrets.length > 0 && (
              <>
                <CommandGroup heading="SECRETS">
                  {searchResults.secrets.map((secret) => (
                    <Link
                      href={`/${selectedWorkspace!.slug}/${secret.project?.slug ?? selectedProject?.slug}?tab=secret&highlight=${secret.slug}`}
                      key={secret.slug}
                      onClick={() => setIsOpen(false)}
                    >
                      <CommandItem>
                        <SecretSVG className="mr-2 h-4 w-4" />
                        <span>{secret.slug}</span>
                        {secret.slug ? (
                          <span className="ml-2 text-sm text-gray-200">
                            ({secret.slug})
                          </span>
                        ) : null}
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {searchResults.environments.length > 0 && (
              <>
                <CommandGroup heading="ENVIRONMENTS">
                  {searchResults.environments.map((environment) => (
                    <Link
                      href={`/${selectedWorkspace!.slug}/${environment.project?.slug ?? selectedProject?.slug}?tab=environment&highlight=${environment.slug}`}
                      key={environment.slug}
                      onClick={() => setIsOpen(false)}
                    >
                      <CommandItem>
                        <EnvironmentSVG className="mr-2 h-4 w-4" />
                        <span>{environment.slug}</span>
                        {environment.description ? (
                          <span className="ml-2 text-sm text-gray-200">
                            {environment.description}
                          </span>
                        ) : null}
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {searchResults.variables.length > 0 && (
              <CommandGroup heading="VARIABLES">
                {searchResults.variables.map((variable) => (
                  <Link
                    href={`/${selectedWorkspace!.slug}/${variable.project?.slug ?? selectedProject?.slug}?tab=variable&highlight=${variable.slug}`}
                    key={variable.slug}
                    onClick={() => setIsOpen(false)}
                  >
                    <CommandItem>
                      <VariableSVG className="mr-2 h-4 w-4" />
                      <span>{variable.name}</span>
                      {variable.note ? (
                        <span className="ml-2 text-sm text-gray-200">
                          {variable.note}
                        </span>
                      ) : null}
                    </CommandItem>
                  </Link>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
      <CommandShortcut className="flex w-full items-center justify-between p-4  text-gray-500">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex gap-1">
              <span className="rounded-md bg-neutral-800 p-1">
                <ArrowUpSVG />
              </span>
              <span className="rounded-md bg-neutral-800 p-1">
                <ArrowDownSVG />
              </span>
            </div>
            <p className="text-sm">to navigate</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-md bg-neutral-800 p-1">
              <SelectSVG />
            </div>
            <p className="text-sm">to select</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="rounded-md bg-neutral-800 p-1">ESC</div>
          <p className="text-sm">to close</p>
        </div>
      </CommandShortcut>
    </CommandDialog>
  )
}

export default SearchModel
