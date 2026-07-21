const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim()

const googleSignInPlugin = iosUrlScheme
  ? [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme,
      },
    ]
  : '@react-native-google-signin/google-signin'

const easProjectId = process.env.EAS_PROJECT_ID?.trim()
  || 'a77892e9-328c-43b4-96a6-1b65180891d3'

export default {
  expo: {
    name: 'Plan Things',
    slug: 'plan-things-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'planthings',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    owner: 'arthur-fleming-planthings',
    android: {
      package: 'com.planthings.mobile',
      softwareKeyboardLayoutMode: 'pan',
      edgeToEdgeEnabled: true,
    },
    androidStatusBar: {
      backgroundColor: '#00000000',
      translucent: true,
    },
    androidNavigationBar: {
      backgroundColor: '#000000',
      barStyle: 'light-content',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.planthings.mobile',
    },
    assetBundlePatterns: [
      '**/*',
    ],
    plugins: [
      'expo-dev-client',
      googleSignInPlugin,
    ],
    extra: {
      eas: {
        projectId: easProjectId,
      },
    },
  },
}
