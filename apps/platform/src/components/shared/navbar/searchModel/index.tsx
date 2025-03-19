 
'use client'
import type { Dispatch, SetStateAction } from 'react'
import React, { useEffect, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { useAtom, useAtomValue } from 'jotai'
import type { WorkspaceWithTierLimitAndProjectCount } from '@keyshade/schema'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CommandDialogProps } from '@/components/ui/command'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { globalSearchDataAtom, selectedProjectAtom, selectedWorkspaceAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { useDebounce } from '@/hooks/use-debounce'
import { Skeleton } from '@/components/ui/skeleton'

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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const [globalSearchData, setGlobalSearchData] = useAtom(globalSearchDataAtom)
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(selectedWorkspaceAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const getGlobalSearchData = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.globalSearch({
      workspaceSlug: selectedWorkspace!.slug,
      search: searchQuery
    })
  )

  // Initialize Fuse instances for each data type
  const fuseInstances = useMemo(() => ({
    workspaces: new Fuse(globalSearchData.workspaces, searchOptions),
    secrets: new Fuse(globalSearchData.secrets, searchOptions),
    projects: new Fuse(globalSearchData.projects, searchOptions),
    environments: new Fuse(globalSearchData.environments, searchOptions),
    variables: new Fuse(globalSearchData.variables, searchOptions)
  }), [globalSearchData])

  // Search for results based on the current search query
  const searchResults = useMemo(() => {
    if (!searchQuery) {
      return globalSearchData;
    }

    return {
      workspaces: fuseInstances.workspaces.search(searchQuery).map(result => result.item),
      secrets: fuseInstances.secrets.search(searchQuery).map(result => result.item),
      projects: fuseInstances.projects.search(searchQuery).map(result => result.item),
      environments: fuseInstances.environments.search(searchQuery).map(result => result.item),
      variables: fuseInstances.variables.search(searchQuery).map(result => result.item)
    }
  }, [searchQuery, fuseInstances, globalSearchData])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const debouncedSetValue = useDebounce((value: string) => {
    setDebouncedValue(value)
  }, 500)

  const hasNoResults = Object.values(searchResults).every((results: unknown) => Array.isArray(results) && results.length === 0)

  useEffect(() => {
    if (hasNoResults && debouncedValue) {
      setIsSearching(true);
      getGlobalSearchData()
        .then(({ data, success }) => {
          if (success && data) {
            setGlobalSearchData({
              workspaces: [],
              secrets: data.secrets,
              projects: data.projects,
              environments: data.environments,
              variables: data.variables
            });
          }
        })
        .finally(() => setIsSearching(false));
    }
  }, [hasNoResults, debouncedValue, getGlobalSearchData, setGlobalSearchData]);

  // Update the search results when the search query changes
  useEffect(() => {
    debouncedSetValue(searchQuery)
  }, [debouncedSetValue, searchQuery])

  const handleChangeWorkspace = (workspace: WorkspaceWithTierLimitAndProjectCount) => {
    const newWorkspace = {...workspace, projects: 0}
    setSelectedWorkspace(newWorkspace)
    router.push("/")
  }

  return (
    <CommandDialog onOpenChange={setIsOpen} open={isOpen} {...props}>
      <CommandInput 
        onValueChange={handleSearch} 
        placeholder="Search by name, slug or description"
        value={searchQuery}
      />
      <CommandList>
        {isSearching ? (
          <CommandSkeletonLoader />
        ) : hasNoResults ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <>
            {searchResults.workspaces.length > 0 && (
              <>
                <CommandGroup heading="Workspaces">
                  {searchResults.workspaces.map(workspace => (
                    <CommandItem
                    key={workspace.id}
                    onClick={() => handleChangeWorkspace(workspace)}
                    >
                      <span>{workspace.name}</span>
                      {workspace.slug ? <span className="text-sm text-gray-500 ml-2">
                          ({workspace.slug})
                        </span> : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {searchResults.secrets.length > 0 && (
              <>
                <CommandGroup heading="Secrets">
                  {searchResults.secrets.map(secret => (
                    <Link
                    href={`/${selectedWorkspace!.slug}/${secret.project?.slug ?? selectedProject?.slug}?tab=secret&highlight=${secret.slug}`}
                    key={secret.slug}
                    >
                      <CommandItem>
                        <span>{secret.slug}</span>
                        {secret.slug ? <span className="text-sm text-gray-500 ml-2">
                            ({secret.slug})
                          </span> : null}
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {searchResults.projects.length > 0 && (
              <>
                <CommandGroup heading="Projects">
                  {searchResults.projects.map(project => (
                    <Link
                    href={`/${selectedWorkspace!.slug}/${project.slug}?tab=secret`}
                    key={project.slug}
                    >
                      <CommandItem key={project.slug}>
                        <span>{project.slug}</span>
                        {project.description ? <span className="text-sm text-gray-500 ml-2">
                            {project.description}
                          </span> : null}
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {searchResults.environments.length > 0 && (
              <>
                <CommandGroup heading="Environments">
                  {searchResults.environments.map(environment => (
                    <Link
                    href={`/${selectedWorkspace!.slug}/${environment.project?.slug ?? selectedProject?.slug}?tab=environment&highlight=${environment.slug}`}
                    key={environment.slug}
                    >
                      <CommandItem>
                        <span>{environment.slug}</span>
                        {environment.description ? <span className="text-sm text-gray-500 ml-2">
                            {environment.description}
                          </span> : null}
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {searchResults.variables.length > 0 && (
              <CommandGroup heading="Variables">
                {searchResults.variables.map(variable => (
                  <Link
                  href={`/${selectedWorkspace!.slug}/${variable.project?.slug ?? selectedProject?.slug}?tab=variable&highlight=${variable.slug}`}
                  key={variable.slug}
                  >
                    <CommandItem>
                      <span>{variable.name}</span>
                      {variable.note ? <span className="text-sm text-gray-500 ml-2">
                          {variable.note}
                        </span> : null}
                    </CommandItem>
                  </Link>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

export default SearchModel

export function CommandSkeletonLoader() {
  return (
    <CommandEmpty className="p-3">
      <div className="space-y-5">
        {Array.from({ length: 2 }).map((val: number) => (
          <div className="flex flex-col gap-2" key={val}>
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </CommandEmpty>
  )
}
