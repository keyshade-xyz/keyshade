'use client'
import React, { useState } from 'react'
import { ScanResponse } from '@/util/types'

function RepoInput() {
  const [url, setUrl] = useState('')
  const [responseData, setResponseData] = useState<ScanResponse | null>(null)
  const [streamData, setStreamData] = useState<string[]>([])

  const handleOnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResponseData({ loading: true })
    setStreamData([]) // Clear previous stream data

    try {
      const response = await fetch('/api/scan?github_url=' + url)
      if (!response.ok) {
        const data = await response.json()
        setResponseData({ error: data.error, loading: false })
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader?.read()!
        done = readerDone
        const chunk = decoder
          .decode(value, { stream: true })
          .split('<%keyshade-delim%>')
          .filter((s) => s.length > 0)
        console.log(chunk, streamData)
        setStreamData((prev) => [...prev, ...chunk])
      }

      setResponseData({ loading: false })
    } catch {
      setResponseData({ error: 'Internal Error', loading: false })
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
      {streamData.length > 0 && (
        <div className="mt-4 grid gap-4">
          {streamData.map((chunk, index) => {
            console.log('>>' + chunk + '<<')
            const { secret: file } = JSON.parse(chunk)
            return (
              <div key={index} className="grid gap-1 overflow-auto text-sm">
                <p className="flex flex-wrap justify-center text-center text-sky-500">
                  {file.file}:{file.line}
                </p>
                <p className="flex flex-wrap justify-center text-center">
                  {file.content}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default RepoInput
