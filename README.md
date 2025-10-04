# Money Trail

Money Trail is a React Native Expo app for automatic expense tracking via SMS parsing. It analyzes banking SMS messages to extract transaction data, categorize expenses, and provide comprehensive financial insights through an intuitive dashboard interface.

## 🚀 Key Features

- **📱 Automatic SMS Parsing**: Automatically detects and parses banking SMS messages
- **💰 Transaction Categorization**: Smart categorization of expenses and income
- **📊 Financial Dashboard**: Real-time insights with KPIs and trend analysis
- **🔔 Smart Notifications**: Alerts for spending patterns and budget limits
- **📈 Analytics & Insights**: Detailed charts and spending analytics
- **🎯 Budget Alerts**: Customizable spending alerts and notifications
- **🔄 Background Sync**: Automatic transaction sync in the background
- **🌙 Dark Mode**: Full dark/light theme support
- **📴 Offline Support**: Works offline with local SQLite database

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Android development environment
- Android device or emulator

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/berlinbruno/money-trail.git
   cd money-trail
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Run on Android:
   - Press `a` to launch in Android emulator
   - Or scan QR code with Expo Go app on your Android device

### Development Commands

```bash
npm run dev          # Start Expo dev server
npm run type-check   # TypeScript compilation check
npm run format       # Prettier formatting
npm run lint:fix     # Auto-fix linting issues
```

## 🔐 Permissions & Setup

### Required Permissions

Money Trail requires the following Android permissions:

- **SMS Access**: To read banking SMS messages for transaction parsing
- **Background Tasks**: For automatic SMS sync and processing
- **Wake Lock**: To maintain background processing

### First Launch Setup

1. **Grant SMS Permission**: The app will request SMS access on first launch
2. **Enable Background Sync**: Configure automatic transaction sync intervals
3. **Review Categories**: Check and customize transaction categories
4. **Set Alerts**: Configure spending alerts and budget notifications

> **Note**: SMS permission is essential for the core functionality. The app can run without it but won't automatically parse transactions.

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: [Expo Router](https://expo.dev/router) with drawer and tab navigation
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) via [Nativewind](https://www.nativewind.dev/)
- **UI Components**: [React Native Reusables](https://github.com/founded-labs/react-native-reusables)
- **Database**: SQLite with [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **SMS Processing**: [react-native-get-sms-android](https://github.com/react-native-sms-retriever/react-native-sms-retriever)
- **Background Tasks**: [Expo TaskManager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- **State Management**: React Context + Hooks
- **TypeScript**: Full type safety throughout the application
- **Charts**: [react-native-gifted-charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts)

## 📱 Platform Support

- ✅ **Android**: Full support with SMS access
- ❌ **iOS**: Not supported (SMS access limitations)
- ❌ **Web**: Not applicable for SMS parsing

## 🏗️ Project Architecture

### Core Components

- **SMS Processing Pipeline**: Automatic detection and parsing of banking SMS
- **Transaction Management**: CRUD operations with smart categorization
- **Dashboard Analytics**: Real-time financial insights and KPIs
- **Alert System**: Customizable spending and budget notifications
- **Background Sync**: Automated SMS processing with configurable intervals

### Key Directories

```text
├── app/                    # Expo Router pages
├── components/             # Reusable UI components
│   ├── ui/                # Base UI primitives
│   ├── dialogs/           # Dialog components
│   └── {domain}/          # Feature-specific components
├── lib/                   # Core business logic
│   ├── database/          # SQLite queries and operations
│   └── sms/               # SMS processing pipeline
├── utils/                 # Utility functions
├── contexts/              # React context providers
├── types/                 # TypeScript type definitions
└── constants/             # App constants and configurations
```

## 📚 Documentation

For detailed development guidelines and architecture information, see:

- [Copilot Instructions](.github/copilot-instructions.md) - Comprehensive development guide
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Nativewind Docs](https://www.nativewind.dev/)

## 🚀 Deployment

Money Trail is configured for Android deployment using [Expo Application Services (EAS)](https://expo.dev/eas).

### Build Commands

```bash
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production
```

### EAS Configuration

- **Target Platform**: Android only
- **Build Profiles**: Development, Preview, Production
- **Package**: Configured in `eas.json`

For more information:

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Test SMS parsing with various banking SMS formats
4. Ensure proper error handling for permissions
5. Update documentation for new features

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [React Native Reusables](https://github.com/founded-labs/react-native-reusables) for the excellent UI components
- [Expo](https://expo.dev/) for the amazing development platform
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling approach
