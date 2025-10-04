module.exports = {
  expo: {
    name: 'money-trail',
    slug: 'money-trail',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'money-trail',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    android: {
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: process.env.EXPO_PUBLIC_ANDROID_PACKAGE,
      permissions: [
        'READ_SMS',
        'RECEIVE_SMS',
        'VIBRATE',
        'WAKE_LOCK',
        'FOREGROUND_SERVICE',
        'READ_PHONE_STATE',
        'RECEIVE_WAP_PUSH',
      ],
    },
    plugins: ['expo-router', 'expo-sqlite', 'expo-background-task'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      },
    },
    owner: process.env.EXPO_PUBLIC_OWNER,
    platforms: ['android'],
  },
};
