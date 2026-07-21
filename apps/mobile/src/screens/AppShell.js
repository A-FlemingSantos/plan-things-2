import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import BottomTabs, { BOTTOM_TAB_BAR_HEIGHT } from '../components/BottomTabs'
import HomeScreen from './HomeScreen'
import FilesScreen from './FilesScreen'
import SettingsScreen from './SettingsScreen'
import MobileKanbanBoard from './MobileKanbanBoard'
import { theme } from '../theme/tokens'
import { useThemedStyles } from '../theme/ThemeProvider'

const bottomTabsOverlayHeight = BOTTOM_TAB_BAR_HEIGHT
const Tab = createBottomTabNavigator()
const HomeStack = createNativeStackNavigator()

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeList" component={HomeScreen} />
      <HomeStack.Screen name="Board" component={MobileKanbanBoard} />
    </HomeStack.Navigator>
  )
}

export default function AppShell() {
  styles = useThemedStyles(createStyles)

  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.page}>
          <Tab.Navigator
            initialRouteName="home"
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <BottomTabs {...props} />}
          >
            <Tab.Screen name="home" component={HomeStackScreen} />
            <Tab.Screen name="files">
              {() => <FilesScreen bottomOverlayOffset={bottomTabsOverlayHeight} />}
            </Tab.Screen>
            <Tab.Screen name="settings" component={SettingsScreen} />
          </Tab.Navigator>
        </View>
      </SafeAreaView>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  safe: {
    flex: 1,
    backgroundColor: theme.colors.appBg,
  },
  page: {
    flex: 1,
    zIndex: 2,
  },
})

let styles = createStyles(theme)
