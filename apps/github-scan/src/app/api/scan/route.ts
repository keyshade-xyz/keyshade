import { NextRequest, NextResponse } from 'next/server'
import { ScanResult } from '@/util/types'

const GITHUB_SCAN_API = process.env.GITHUB_SCAN_API
const username = process.env.GITHUB_SCAN_API_USERNAME
const password = process.env.GITHUB_SCAN_API_PASSWORD

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
    const respone = await fetch(GITHUB_SCAN_API + '/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, githubUrl: githubUrl })
    })
    const data: { files: ScanResult[] } = await respone.json()
    if (data.files.length === 0) {
      return NextResponse.json({ isVulnerable: false })
    }
    return NextResponse.json({ isVulnerable: true, files: data.files })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
