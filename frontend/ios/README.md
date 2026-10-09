# iOS Native Directory

On Windows, iOS native files (.xcodeproj, CocoaPods) require macOS with Xcode, or EAS Build:
```bash
eas build --platform ios
```
All iOS configuration is specified in `app.json` (bundle identifier: `com.tms.mobileapp`).
When running on macOS or in cloud CI, generate native files with:
```bash
npx expo prebuild --platform ios
```
