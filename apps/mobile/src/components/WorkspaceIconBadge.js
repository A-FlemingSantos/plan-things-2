import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

const DEFAULT_WORKSPACE_ICON_KEY = 'BUILDING'

const ICON_COMPONENTS = {
  BUILDING: BuildingGlyph,
  ROCKET: RocketGlyph,
  BRIEFCASE: BriefcaseGlyph,
  LAYERS: LayersGlyph,
  COMPASS: CompassGlyph,
  LIGHTBULB: LightbulbGlyph,
  PALETTE: PaletteGlyph,
  SPARKLES: SparklesGlyph,
}

export function normalizeWorkspaceIconKey(value) {
  if (typeof value !== 'string') {
    return DEFAULT_WORKSPACE_ICON_KEY
  }

  const normalized = value.trim().toUpperCase()
  return ICON_COMPONENTS[normalized] ? normalized : DEFAULT_WORKSPACE_ICON_KEY
}

export default function WorkspaceIconBadge({
  accessibilityLabel,
  color = '#6B7280',
  iconKey,
  size = 16,
  style,
}) {
  const normalizedIconKey = normalizeWorkspaceIconKey(iconKey)
  const Glyph = ICON_COMPONENTS[normalizedIconKey]

  return (
    <View style={[styles.badge, style]} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Glyph color={color} size={size} />
    </View>
  )
}

function BuildingGlyph({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x="2" y="2.5" width="12" height="11.5" rx="1.6" stroke={color} strokeWidth="1.3" />
      <Path d="M6 14v-3.5h4V14M5.2 5.5h1.1M9.7 5.5h1.1M5.2 8h1.1M9.7 8h1.1" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  )
}

function RocketGlyph({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M9.3 2.2c1.8.3 3 1.5 3.3 3.3.2 1.2-.1 2.5-.9 3.5l-3.2 3.9-1.4-1.4 3.9-3.2c1-.8 1.3-2.1 1-3.3-.1-.5-.4-.8-.8-.9-1.2-.3-2.5 0-3.3 1L4.7 9l-1.6-1.6 3.9-3.2c1-.8 2.3-1.1 3.5-1z" fill={color} />
      <Path d="M5.1 8.9 3 11l-.8 2 2-.8 2.1-2.1M9.2 6.8a1 1 0 1 0 1.4-1.4 1 1 0 0 0-1.4 1.4z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function BriefcaseGlyph({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x="2" y="4.5" width="12" height="8.5" rx="1.6" stroke={color} strokeWidth="1.3" />
      <Path d="M6 4.5V3.7c0-.7.6-1.2 1.2-1.2h1.6c.7 0 1.2.5 1.2 1.2v.8M2 8h12" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function LayersGlyph({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 2.5 13.5 5.5 8 8.5 2.5 5.5 8 2.5zM13.5 8.3 8 11.3 2.5 8.3M13.5 11.1 8 14.1 2.5 11.1" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function CompassGlyph({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="5.5" stroke={color} strokeWidth="1.3" />
      <Path d="m10.8 5.2-1.9 4-4 1.9 1.9-4 4-1.9z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <Circle cx="8" cy="8" r=".7" fill={color} />
    </Svg>
  )
}

function LightbulbGlyph({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M5.2 6.3a2.8 2.8 0 1 1 5.6 0c0 1.1-.5 1.8-1.1 2.4-.6.5-1 .9-1.2 1.5H7.5c-.2-.6-.6-1-1.2-1.5-.6-.6-1.1-1.3-1.1-2.4zM6.7 11.1h2.6M7 13h2" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function PaletteGlyph({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 2.3a5.7 5.7 0 1 0 0 11.4h1.3c.8 0 1.4-.7 1.4-1.5 0-.5-.2-.8-.4-1.1-.2-.2-.4-.5-.4-.8 0-.7.6-1.3 1.3-1.3h.7A2.1 2.1 0 0 0 14 7c0-2.6-2.7-4.7-6-4.7z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
      <Circle cx="5.4" cy="6" r=".7" fill={color} />
      <Circle cx="8" cy="5.2" r=".7" fill={color} />
      <Circle cx="10.4" cy="6.4" r=".7" fill={color} />
    </Svg>
  )
}

function SparklesGlyph({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="m8 2.2.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9.9-2.5zM12.3 8.8l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5.5-1.4zM4.1 9.7l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7z" fill={color} />
    </Svg>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
