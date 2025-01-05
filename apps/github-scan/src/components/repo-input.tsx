'use client'
import React, { useState } from 'react'
import { ScanResponse } from '@/util/types'

function RepoInput() {
  const [url, setUrl] = useState('')
  const [responseData, setResponseData] = useState<ScanResponse | null>(null)

  const handleOnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResponseData({ loading: true })
    try {
      const response = await fetch('/api/scan?github_url=' + url)
      if (!response.ok) throw new Error('Internal Server Error')
      const data = (await response.json()) as ScanResponse['data']
      setResponseData({ data: data, loading: false })
    } catch {
      setResponseData({ error: 'Internal Server Error', loading: false })
    }
  }
  return (
    <>
      <form
        className="grid grid-cols-1 gap-2 sm:w-3/5 sm:grid-cols-6"
        action=""
        onSubmit={handleOnSubmit}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          name="github_url"
          id="github_url"
          className="h-12 w-full rounded-xl bg-slate-600 p-2 placeholder:text-center sm:col-span-5"
          placeholder="Enter a GitHub repo URL"
        />
        {responseData?.loading ? (
          <button
            type="button"
            disabled
            className="h-8 rounded-xl bg-yellow-400 text-white sm:h-full sm:text-sm"
          >
            Scanning..
          </button>
        ) : (
          <button
            type="submit"
            className="h-8 rounded-xl bg-green-400 text-white sm:h-full sm:text-sm"
          >
            Submit
          </button>
        )}
      </form>
      {responseData?.error && (
        <p className="text-center text-red-500">{responseData.error}</p>
      )}
      {responseData?.data && (
        <div className="mt-4 grid gap-4">
          {responseData.data.isVulnerable ? (
            <p className="text-center text-red-400">Vulnerable</p>
          ) : (
            <p className="text-center text-emerald-400">Not Vulnerable</p>
          )}

          {responseData.data.files?.map((file) => (
            <div key={file.file} className="grid gap-1 overflow-auto text-sm">
              <p className="flex flex-wrap justify-center text-center text-sky-500">
                {file.file}:{file.line}
              </p>
              <p className="flex flex-wrap justify-center text-center">
                {file.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default RepoInput
