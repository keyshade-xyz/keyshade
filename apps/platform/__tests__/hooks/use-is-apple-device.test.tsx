import { render, screen } from '@testing-library/react'
import { useIsAppleDevice } from '@/hooks/use-is-apple-device'

function IsAppleDeviceTestComponent() {
  const { isApple } = useIsAppleDevice()
  return <div data-testid="result">{isApple ? 'true' : 'false'}</div>
}

/**
 * A helper function to test the useIsAppleDevice hook with a specific
 * User Agent string.
 *
 * @param userAgent - The User Agent string to test with
 * @param expectedResult - The expected result of the hook
 */
function testUserAgent(userAgent: string, expectedResult: boolean) {
  const spy = jest.spyOn(window.navigator, 'userAgent', 'get')
  spy.mockReturnValue(userAgent)

  render(<IsAppleDeviceTestComponent />)

  const textContent = screen.getByTestId('result').textContent

   expect(textContent).toBe(expectedResult.toString())

  spy.mockRestore()
}

/**
 * A list of User Agent strings for different operating systems and browsers
 */
const osAgentPairs = {
  mac: {
    chrome:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    safari:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
    firefox:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0'
  },
  windows: {
    chrome:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    firefox:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0'
  },
  linux: {
    chrome:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    firefox:
      'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0'
  },
  iphone: {
    safari:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    chrome:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.0.0 Mobile/15E148 Safari/604.1',
    firefox:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/125.0 Mobile/15E148 Safari/605.1.15',
    edge: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/125.0 Mobile/15E148 Safari/605.1.15'
  },
  android: {
    chrome:
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    firefox:
      'Mozilla/5.0 (Android 13; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0',
    edge: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 EdgA/125.0.0.0'
  },
  iPad: {
    chrome:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.0.0 Mobile/15E148 Safari/604.1',
    firefox:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/125.0 Mobile/15E148 Safari/605.1.15',
    edge: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/125.0 Mobile/15E148 Safari/605.1.15',
    safari:
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  androidTablet: {
    chrome:
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    firefox:
      'Mozilla/5.0 (Android 13; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0',
    edge: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 EdgA/125.0.0.0'
  }
} as const

describe('useIsAppleDevice', () => {
  // Chrome
  it('should return true for Chrome on Mac', () => {
    testUserAgent(osAgentPairs.mac.chrome, true)
  })
  it('should return false for Chrome on Windows', () => {
    testUserAgent(osAgentPairs.windows.chrome, false)
  })
  it('should return false for Chrome on Linux', () => {
    testUserAgent(osAgentPairs.linux.chrome, false)
  })
  it('should return true Chrome iPhone', () => {
    testUserAgent(osAgentPairs.iphone.chrome, true)
  })
  it('should return true Chrome iPad', () => {
    testUserAgent(osAgentPairs.iPad.chrome, true)
  })
  it('should return false Chrome Android', () => {
    testUserAgent(osAgentPairs.android.chrome, false)
  })
  it('should return false Chrome Android Tablet', () => {
    testUserAgent(osAgentPairs.androidTablet.chrome, false)
  })

  // Safari
  it('should return true for Safari on Mac', () => {
    testUserAgent(osAgentPairs.mac.safari, true)
  })
  it('should return true for Safari on iPhone', () => {
    testUserAgent(osAgentPairs.iphone.safari, true)
  })
  it('should return true for Safari on iPad', () => {
    testUserAgent(osAgentPairs.iPad.safari, true)
  })

  // Firefox
  it('should return true for Firefox on Mac', () => {
    testUserAgent(osAgentPairs.mac.firefox, true)
  })
  it('should return true for Firefox on iPhone', () => {
    testUserAgent(osAgentPairs.iphone.firefox, true)
  })
  it('should return true for Firefox on iPad', () => {
    testUserAgent(osAgentPairs.iPad.firefox, true)
  })
  it('should return false for Firefox on Windows', () => {
    testUserAgent(osAgentPairs.windows.firefox, false)
  })
  it('should return false for Firefox on Linux', () => {
    testUserAgent(osAgentPairs.linux.firefox, false)
  })
  it('should return false for Firefox on Android', () => {
    testUserAgent(osAgentPairs.android.firefox, false)
  })
  it('should return false for Firefox on Android Tablet', () => {
    testUserAgent(osAgentPairs.androidTablet.firefox, false)
  })

  // Edge
  it('should return true for Edge on Mac', () => {
    testUserAgent(osAgentPairs.mac.safari.replace('Safari', 'Edg'), true)
  })
  it('should return true for Edge on iPhone', () => {
    testUserAgent(osAgentPairs.iphone.edge, true)
  })
  it('should return true for Edge on iPad', () => {
    testUserAgent(osAgentPairs.iPad.edge, true)
  })
  it('should return false for Edge on Windows', () => {
    testUserAgent(osAgentPairs.windows.edge, false)
  })
  it('should return false for Edge on Linux', () => {
    testUserAgent(osAgentPairs.linux.chrome.replace('Chrome', 'Edg'), false)
  })
  it('should return false for Edge on Android', () => {
    testUserAgent(osAgentPairs.android.edge, false)
  })
  it('should return false for Edge on Android Tablet', () => {
    testUserAgent(osAgentPairs.androidTablet.edge, false)
  })
})
