import { Platform } from 'react-native'

export function platformShadow({
  boxShadow,
  color,
  offset,
  opacity,
  radius,
  elevation,
}) {
  return Platform.select({
    web: {
      boxShadow,
    },
    default: {
      shadowColor: color,
      shadowOffset: offset,
      shadowOpacity: opacity,
      shadowRadius: radius,
      ...(typeof elevation === 'number' ? { elevation } : {}),
    },
  })
}
