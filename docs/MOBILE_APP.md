# Mobile App Preparation

This document outlines the mobile app strategy for Dental Story WebApp, including Trusted Web Activity (TWA) setup for Android and iOS app shell preparation.

## Overview

The mobile app strategy uses a hybrid approach:
- **Progressive Web App (PWA)** - Core functionality works offline
- **Trusted Web Activity (TWA)** - Android native app wrapper
- **iOS App Shell** - Native iOS wrapper with WKWebView

## Trusted Web Activity (TWA) for Android

### What is TWA?

TWA allows you to package your PWA as a native Android app that runs in fullscreen Chrome without browser UI.

### Prerequisites

- Valid SSL certificate (HTTPS)
- Service Worker registered
- Web App Manifest configured
- Digital Asset Links setup

### Setup Steps

#### 1. Configure assetlinks.json

File located at: `public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.dentalstory.webapp",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

**To get SHA256 fingerprint:**
```bash
keytool -list -v -keystore your-keystore.jks
```

#### 2. Create Android Project

Use Bubblewrap CLI to generate Android project:

```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize TWA project
bubblewrap init --manifest https://yourdomain.com/manifest.json

# Build APK
bubblewrap build

# Install on device
bubblewrap install
```

#### 3. AndroidManifest.xml Configuration

Key configurations:
- Set `android:name` for application
- Configure intent filters for deep linking
- Set theme for splash screen
- Configure orientation

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.dentalstory.webapp">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/LauncherTheme">
        
        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:label="@string/app_name"
            android:theme="@style/LauncherTheme"
            android:exported="true">
            
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="yourdomain.com" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

#### 4. Build & Deploy

```bash
# Build release APK
./gradlew assembleRelease

# Sign APK
jarsigner -keystore your-keystore.jks \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  your-alias

# Align APK
zipalign -v -p 4 app-release-unsigned.apk app-release.apk

# Verify
apksigner verify app-release.apk
```

## iOS App Shell

### Approach

Use WKWebView to wrap the PWA in a native iOS app.

### Setup Steps

#### 1. Create Xcode Project

1. Open Xcode
2. Create new App project
3. Select SwiftUI or Storyboard
4. Configure bundle identifier: `com.dentalstory.webapp`

#### 2. Configure Info.plist

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>

<key>UIApplicationSceneManifest</key>
<dict>
    <key>UIApplicationSupportsMultipleScenes</key>
    <false/>
</dict>
```

#### 3. ViewController.swift

```swift
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    var webView: WKWebView!
    
    override func loadView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        view = webView
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        if let url = URL(string: "https://yourdomain.com") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
    
    // Enable offline support
    func webView(_ webView: WKWebView, 
                 didFailProvisionalNavigation navigation: WKNavigation!, 
                 withError error: Error) {
        // Show offline page
        if let offlineURL = Bundle.main.url(forResource: "offline", withExtension: "html") {
            webView.loadFileURL(offlineURL, allowingReadAccessTo: offlineURL)
        }
    }
}
```

#### 4. Build Configuration

```bash
# Build for simulator
xcodebuild -scheme YourApp -sdk iphonesimulator

# Build for device
xcodebuild -scheme YourApp -sdk iphoneos

# Archive for App Store
xcodebuild -scheme YourApp archive -archivePath build/YourApp.xcarchive
```

## PWA Enhancements for Mobile

### 1. Manifest Updates

Enhanced `manifest.json` for better mobile experience:

```json
{
  "name": "Dental Story",
  "short_name": "Dental Story",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0066cc",
  "background_color": "#ffffff",
  "categories": ["health", "medical"],
  "prefer_related_applications": false,
  "related_applications": [
    {
      "platform": "play",
      "id": "com.dentalstory.webapp"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 2. Mobile-Specific Features

- Touch gestures support
- Native-like navigation
- Hardware back button handling
- Status bar theming
- Splash screen
- Pull-to-refresh

### 3. Viewport Configuration

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
```

## Testing

### Android Testing

```bash
# Install on emulator
adb install app-release.apk

# Test deep links
adb shell am start -a android.intent.action.VIEW \
  -d "https://yourdomain.com/services"

# Debug TWA
chrome://inspect/#devices
```

### iOS Testing

```bash
# Run on simulator
xcrun simctl install booted YourApp.app

# Test on device
ios-deploy --bundle YourApp.app
```

### PWA Testing

- Lighthouse audit
- Chrome DevTools Application panel
- Test offline functionality
- Test install prompt
- Test manifest

## App Store Submission

### Google Play Store

1. Create Play Console account
2. Generate signed APK/AAB
3. Create store listing
4. Upload APK/AAB
5. Set pricing & distribution
6. Submit for review

**Required Assets:**
- Icon: 512x512px
- Feature graphic: 1024x500px
- Screenshots: 320x3840px to 3840x320px
- Privacy policy URL
- App content rating

### Apple App Store

1. Create App Store Connect account
2. Create app record
3. Upload build via Xcode
4. Fill app information
5. Submit for review

**Required Assets:**
- App Icon: 1024x1024px
- Screenshots: iPhone (6.5", 5.5") & iPad
- App preview videos (optional)
- Privacy policy URL
- Support URL

## Maintenance

### Updates

- PWA updates instantly
- Native apps require new releases
- Use app version codes to track

### Monitoring

- Track app installs
- Monitor crash reports
- Analyze user behavior
- A/B test features

## Future Enhancements

1. **Push Notifications**
   - FCM for Android
   - APNs for iOS

2. **Biometric Authentication**
   - Fingerprint
   - Face ID

3. **Native Features**
   - Camera integration
   - Calendar integration
   - Contact picker

4. **Offline-First**
   - Enhanced caching
   - Background sync
   - Conflict resolution

## Resources

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Developer Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [PWA Best Practices](https://web.dev/pwa/)
- [iOS WKWebView Guide](https://developer.apple.com/documentation/webkit/wkwebview)

## Support

For issues or questions:
- GitHub Issues: [repository-url]
- Email: support@dentalstory.com
