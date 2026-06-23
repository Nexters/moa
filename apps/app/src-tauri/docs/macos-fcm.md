# macOS FCM setup

Apple login sends `fcmDeviceToken` to `/api/v1/auth/apple`. If token registration fails, login continues with an empty string.

Required local setup:

- Copy `GoogleService-Info.plist.example` to `GoogleService-Info.plist` and fill it from Firebase.
- Copy `Entitlements.push.example.plist` to the release/dev entitlement file used by signing.
- Enable Push Notifications for `com.moa.app` in the Apple Developer portal.
- Wire Firebase Messaging native SDK into `push_notifications::platform::fetch_fcm_device_token`.

Do not commit real Firebase config, APNs credentials, FCM tokens, or Apple private keys.
