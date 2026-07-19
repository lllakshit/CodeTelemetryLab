import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web.',
      );
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are only configured for Android in this project.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyChKW-0TvAOdbYIfkPE7fE7UdovIVZtXlI',
    appId: '1:47209061705:android:c3903c3435d84c5a380e98',
    messagingSenderId: '47209061705',
    projectId: 'codetelemetrylab-18f22',
    storageBucket: 'codetelemetrylab-18f22.firebasestorage.app',
  );
}
