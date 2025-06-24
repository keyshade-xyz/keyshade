import { render, screen, act } from '@testing-library/react'
import { useIsMobileDevice } from '@/hooks/use-is-mobile-device'

function IsAppleDeviceTestComponent() {
  const isMobile = useIsMobileDevice()
  return <div data-testid="result">{isMobile ? 'true' : 'false'}</div>
}

function testDeviceSize(
  size: { width: number; height: number },
  maxTouchPoints: number,
  expectedResult: boolean
) {
  // Save the original window size
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight
  const originalMaxTouchPoints = navigator.maxTouchPoints

  // Set the window size to the test size
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: size.width
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: size.height
  })
  // Set the maxTouchPoints to the test value
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    value: maxTouchPoints
  })

  // Trigger a resize event
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })

  act(() => {
    render(<IsAppleDeviceTestComponent />)
  })
  const textContent = screen.getByTestId('result').textContent

  // Check if the result matches the expected result
  expect(textContent).toBe(expectedResult.toString())

  // Restore the original window size
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: originalWidth
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: originalHeight
  })
  // Restore the original maxTouchPoints
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    value: originalMaxTouchPoints
  })
  // Trigger a resize event to reset the state
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

const mockData = {
  smallTouchDevice: {
    size: { width: 375, height: 667 },
    maxTouchPoints: 1,
    expectedResult: true
  },
  largeTouchDevice: {
    size: { width: 1024, height: 768 },
    maxTouchPoints: 1,
    expectedResult: false
  },
  smallNonTouchDevice: {
    size: { width: 800, height: 600 },
    maxTouchPoints: 0,
    expectedResult: false
  },
  largeNonTouchDevice: {
    size: { width: 1920, height: 1080 },
    maxTouchPoints: 0,
    expectedResult: false
  }
}

describe('useIsMobileDevice', () => {
  beforeEach(() => {
    // Mock window.innerWidth and window.innerHeight
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 0 // Default value
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 0 // Default value
    })

    // Mock navigator.maxTouchPoints
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      writable: true,
      value: 0 // Default value
    })

    // Mock screen.orientation
    Object.defineProperty(window.screen, 'orientation', {
      configurable: true,
      value: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
    })
  })

  it('should return true for small touch devices', () => {
    testDeviceSize(
      mockData.smallTouchDevice.size,
      mockData.smallTouchDevice.maxTouchPoints,
      mockData.smallTouchDevice.expectedResult
    )
  })

  it('should return false for large touch devices', () => {
    testDeviceSize(
      mockData.largeTouchDevice.size,
      mockData.largeTouchDevice.maxTouchPoints,
      mockData.largeTouchDevice.expectedResult
    )
  })

  it('should return false for small non-touch devices', () => {
    testDeviceSize(
      mockData.smallNonTouchDevice.size,
      mockData.smallNonTouchDevice.maxTouchPoints,
      mockData.smallNonTouchDevice.expectedResult
    )
  })

  it('should return false for large non-touch devices', () => {
    testDeviceSize(
      mockData.largeNonTouchDevice.size,
      mockData.largeNonTouchDevice.maxTouchPoints,
      mockData.largeNonTouchDevice.expectedResult
    )
  })
})
