export const colors = {
  white: '#ffffff',
  black: '#000000',
  green: '#0f703a',
  purple: '#d4aef1',
  blue: '#4290da',
  red: '#ff6766',
  amber: '#f5a623',
  gray50: '#fafafa',
  gray100: '#f4f4f4',
  gray200: '#e8e8e8',
  gray300: '#d0d0d0',
  gray400: '#a0a0a0',
  gray600: '#555555',
  gray700: '#333333',
  gray800: '#222222',
}

export const theme = {
  colors: {
    ...colors,
    appBg: colors.white,
    surface1: colors.white,
    surface2: colors.gray50,
    surface3: colors.gray100,
    text1: colors.black,
    text2: colors.gray600,
    text3: colors.gray400,
    border1: colors.gray200,
    border2: colors.gray300,
    focus: colors.blue,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
  },
  spacing: {
    screenX: 18,
    section: 22,
  },
}
