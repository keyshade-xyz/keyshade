import { NextRequest, NextResponse } from 'next/server'
import { secret_scan } from '@/util/scan_secrets'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const github_url = searchParams.get('github_url')

    if (!github_url) {
      return NextResponse.json(
        { error: 'Invalid or missing github_url parameter' },
        { status: 400 }
      )
    }

    const result = await secret_scan(github_url)
    if (result instanceof Array) {
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
    } else return result
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
