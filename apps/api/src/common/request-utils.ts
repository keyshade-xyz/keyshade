import * as UAParser from 'ua-parser-js'

export async function parseLoginRequest(req: any) {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'Unknown'

  const userAgent = req.headers['user-agent'] || 'Unknown'

  const parser = new UAParser.UAParser()
  parser.setUA(userAgent)

  const browser = parser.getBrowser().name || 'Unknown'
  const os = parser.getOS().name || 'Unknown'
  const device = `${browser} on ${os}`

  let location = 'Unknown'
  try {
    const res = await fetch(`https://ipwho.is/${ip}`)
    const geo = await res.json()

    if (geo.success === false) throw new Error(geo.message)

    location =
      [geo.city, geo.region, geo.country].filter(Boolean).join(', ') ||
      'Unknown'
  } catch (err) {
    console.error('IP geolocation failed:', err)
  }

  return {
    ip,
    device,
    location
  }
}
