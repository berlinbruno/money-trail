# Money Trail

**Money Trail** is a personal finance app built with **React Native** & **Expo**, focused on seamless tracking of your spending with style and performance.

---

##  Features

- **SMS Transaction Sync**: Automatically captures transactions from SMS alerts.
- **Local Storage**: Stores data securely using **SQLite**.
- **Insights & Notifications**: Provides spending insights and timely notifications.
- **Transaction Management**: Easily categorize, edit, or delete entries.
- **Modular UI**: Built with a clean, modern interface using **Tailwind CSS**, **NativeWind**, and **TypeScript**.

---

##  Development Setup

### Prerequisites

- Node.js LTS (>= 20)
- Expo CLI (installed globally or via `npm run`)

### Local Setup & Workflow

```bash
git clone https://github.com/berlinbruno/money-trail.git
cd money-trail
npm ci
npm run start              # Launch development server
npm run android            # Open app on Android emulator/device
```

---

##  Code Quality & CI

- Linting, formatting, and type‑checking enforced with `npm run check`.
- **Feature branch CI** checks run automatically on `feature/**` via GitHub Actions.
- Commits must follow **Conventional Commits**—validated via `commitlint`.

---

##  Build Scripts

```jsonc
"scripts": {
  "build:apk:dev": "eas build --profile development --platform android --non-interactive",
  "build:apk:preview": "eas build --profile preview --platform android --non-interactive",
  "build:apk:production": "eas build --profile production --platform android --non-interactive",
}
```

- Use `npm run build:apk:preview` for internal preview builds.
- `build:apk:production` targets store distribution.
- `build:apk:dev` enables local dev client builds.

---

##  CI / CD – Production Release Workflow

GitHub Actions auto-manages releases on `master`:

1. **Semantic Release** handles versioning, CHANGELOG, and GitHub release creation.
2. Builds and fetches Android APK via EAS.
3. Uploads the APK artifact back into the GitHub Release.

See `.github/workflows/release.yml` for details.

---

##  Configuration Files

- **eas.json**: Build profiles for `development`, `preview`, and `production`.
- **release.config.js**: Semantic-release plugin configuration (commit analyzer, GitHub release, etc.).
- **.commitlintrc.json**: Commit message linting rules according to conventional commits.

---

##  Contribution Guidelines

1. Branch from `dev` into a `feature/<your-feature>` branch.
2. Make clean, focused commits (conventional commit style).
3. Push and open a pull request—CI will validate all critical checks.
4. On approval, merge into `master`—the release process runs automatically.

---

##  License

This project is licensed under **MIT**. See [LICENSE](LICENSE) for full terms.

---

**Money Trail** provides robust, modular personal finance tracking—clean UI, CI/CD automation, and dev-friendly tooling make it both efficient and scalable.
