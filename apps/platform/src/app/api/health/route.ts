import { NextResponse } from 'next/server'

export function GET(): unknown {
  return NextResponse.json({ message: 'Hello World' }, { status: 200 })
}
