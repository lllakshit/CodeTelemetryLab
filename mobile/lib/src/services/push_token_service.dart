import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'api_client.dart';
import 'notification_service.dart';

class PushTokenService {
  PushTokenService._();

  static final PushTokenService instance = PushTokenService._();

  StreamSubscription<RemoteMessage>? _messageSubscription;
  StreamSubscription<String>? _tokenRefreshSubscription;
  String? _currentToken;
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    _initialized = true;

    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    _messageSubscription = FirebaseMessaging.onMessage.listen((
      RemoteMessage message,
    ) async {
      await NotificationService.instance.showRemoteMessage(message);
    });
  }

  Future<void> syncRegistration(ApiClient client) async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) {
        return;
      }

      _currentToken = token;
      await client.registerDeviceToken(
        tokenValue: token,
        packageName: 'com.codetelemetrylabs.leads',
        deviceName: defaultTargetPlatform.name,
        appVersion: '1.0.0+1',
      );

      _tokenRefreshSubscription ??= FirebaseMessaging.instance.onTokenRefresh
          .listen((nextToken) async {
            _currentToken = nextToken;
            try {
              await client.registerDeviceToken(
                tokenValue: nextToken,
                packageName: 'com.codetelemetrylabs.leads',
                deviceName: defaultTargetPlatform.name,
                appVersion: '1.0.0+1',
              );
            } catch (error) {
              debugPrint('Device token refresh sync failed: $error');
            }
          });
    } catch (error) {
      debugPrint('Push token registration skipped: $error');
    }
  }

  Future<void> unregister(ApiClient client) async {
    final token = _currentToken;
    if (token == null || token.isEmpty) {
      return;
    }

    try {
      await client.unregisterDeviceToken(token);
    } catch (error) {
      debugPrint('Push token removal skipped: $error');
    }
  }

  Future<void> dispose() async {
    await _messageSubscription?.cancel();
    await _tokenRefreshSubscription?.cancel();
  }
}
