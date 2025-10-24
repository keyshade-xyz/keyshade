import { create } from 'storybook/theming'

export default create({
  base: 'dark',
  brandTitle: 'Keyshade',
  brandUrl: 'https://keyshade.io',
  brandImage: 'https://i.postimg.cc/kXjnph6P/logo-6.png',
  brandTarget: '_blank',

  //   colorPrimary: '#FF0000',
  colorSecondary: '#04282E',

  appBg: '#101013',
  appContentBg: '#141517',
  appPreviewBg: '#0E0E12',
  appBorderColor: '#212125',
  appBorderRadius: 8,

  // Toolbar default and active colors
  barTextColor: '#A4A4A4',
  barSelectedColor: '#7AE2F4',
  barHoverColor: '#59A5B3'
  //   barBg: '#2C2C2C'
})
