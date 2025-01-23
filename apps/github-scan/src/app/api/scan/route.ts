import { NextRequest, NextResponse } from 'next/server'
import { scanRepo } from '@/util/scan-repo'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const githubUrl = searchParams.get('github_url')

    if (!githubUrl) {
      return NextResponse.json(
        { error: 'Invalid or missing github_url parameter' },
        { status: 400 }
      )
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await scanRepo(githubUrl, {
            write: (chunk) => controller.enqueue(chunk),
            close: () => controller.close()
          })
        } catch (error) {
          // if (error instanceof Error) {
          //   console.error('Failed to scan repository:', error)
          //   controller.enqueue(JSON.stringify({ error: error.message }))
          // } else {
          //   controller.enqueue(
          //     JSON.stringify({ error: 'Internal Server Error' })
          //   )
          // }
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to scan repository:')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
