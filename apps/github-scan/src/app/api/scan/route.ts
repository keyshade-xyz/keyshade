import { NextRequest, NextResponse } from 'next/server'
import gitHubScanner from '@/util/github-scanner'

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
    try {
      const result = await gitHubScanner.scanRepo(githubUrl)
      if (result.length > 0)
        return NextResponse.json(
          { isVulnerable: true, files: result },
          { status: 200 }
        )
      else
        return NextResponse.json(
          {
            isVulnerable: false
          },
          { status: 200 }
        )
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Rate limit hit') {
          return NextResponse.json({ error: 'Rate limit hit' }, { status: 429 })
        } else if (error.message === 'Invalid GitHub URL') {
          return NextResponse.json(
            { error: 'Invalid GitHub URL' },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          )
        }
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
