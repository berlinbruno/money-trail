// release.config.js
module.exports = {
  branches: ['master', { name: 'dev', prerelease: 'beta' }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    [
      '@semantic-release/exec',
      {
        prepareCmd: "bash ./.scripts/rename-apk.sh '<%= nextRelease.version %>'",
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md'],
        message: 'chore(release): <%= nextRelease.version %> [skip ci]',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [{ path: 'dist/*.apk', label: 'Android APK' }],
        releaseNameTemplate:
          "<%= branch.name === 'master' ? '🚀 Production Release v' + nextRelease.version : '🧪 Beta Release v' + nextRelease.version %>",
      },
    ],
  ],
};
