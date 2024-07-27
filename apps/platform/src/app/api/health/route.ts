import { NextResponse } from 'next/server'

export function GET(): NextResponse {
  return NextResponse.json({ message: 'Hello World' }, { status: 200 })
}
