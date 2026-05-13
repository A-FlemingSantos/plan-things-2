import { Platform } from 'react-native'

export const shouldUseNativeDriver = Platform.OS !== 'web'
export const interactivePointerEventsStyle = Platform.OS === 'web'
  ? { pointerEvents: 'auto' }
  : null

export function resolveInteractivePointerEventsStyle(isVisible) {
  return isVisible ? interactivePointerEventsStyle : null
}

function resolveWebPointerEvents(pointerEvents) {
  if (pointerEvents === 'none' || pointerEvents === 'box-none') {
    return 'none'
  }

  return 'auto'
}

export function withPlatformPointerEvents(style, pointerEvents) {
  if (Platform.OS === 'web') {
    return {
      style: [style, { pointerEvents: resolveWebPointerEvents(pointerEvents) }],
    }
  }

  return {
    style,
    pointerEvents,
  }
}
