import { Platform } from 'react-native'

export const shouldUseNativeDriver = Platform.OS !== 'web'

export function withPlatformPointerEvents(style, pointerEvents) {
  if (Platform.OS === 'web') {
    return {
      style: [style, { pointerEvents }],
    }
  }

  return {
    style,
    pointerEvents,
  }
}
