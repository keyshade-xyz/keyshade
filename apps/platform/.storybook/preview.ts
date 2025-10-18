import { Preview } from '@storybook/nextjs'

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        // dark: { name: 'Dark', value: '#333' },
        // light: { name: 'Light', value: '#F7F9F2' },
        // 👇 Add your own
        keyshade: { name: 'keyshade', value: '#0E0E12' }
      }
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  initialGlobals: {
    // 👇 Set the initial background color
    backgrounds: { value: 'keyshade' }
  }
}

export default preview
