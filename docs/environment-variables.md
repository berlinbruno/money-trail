# Environment Variables Setup

This project uses environment variables to manage configuration values like project IDs, app names, and other settings.

## Setup

1. **Copy the example file:**

   ```bash
   cp .env.example .env
   ```

2. **Update the values in `.env`:**

   ```bash
   # EAS Project ID
   EXPO_PUBLIC_EAS_PROJECT_ID=your-actual-project-id

   # Owner/Organization
   EXPO_PUBLIC_OWNER=your-username

   # Android Package
   EXPO_PUBLIC_ANDROID_PACKAGE=com.yourcompany.appname
   ```

## Environment Variables

| Variable                      | Description                           | Default                      |
| ----------------------------- | ------------------------------------- | ---------------------------- |
| `EXPO_PUBLIC_EAS_PROJECT_ID`  | EAS Project ID for builds and updates | Required                     |
| `EXPO_PUBLIC_OWNER`           | Expo account owner                    | `berlinbruno`                |
| `EXPO_PUBLIC_ANDROID_PACKAGE` | Android package name                  | `com.berlinbruno.moneytrail` |

## Static Configuration

The following values are configured directly in `app.config.js` and are not configurable via environment variables:

- **App Name**: `money-trail`
- **App Slug**: `money-trail`
- **App Version**: `1.0.0`
- **Orientation**: `portrait`
- **Platforms**: `android` only

## Important Notes

- Environment variables prefixed with `EXPO_PUBLIC_` are exposed to the client-side code
- The `.env` file is ignored by Git for security
- Always use `.env.example` as a template for new environments
- Never commit sensitive values to version control

## Testing Configuration

To verify your environment variables are loaded correctly:

```bash
npx expo config --type introspect
```

This will show you the resolved configuration with environment variables applied.
