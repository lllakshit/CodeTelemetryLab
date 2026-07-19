import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../models/lead.dart';

class NotificationService {
  NotificationService._();

  static final NotificationService instance = NotificationService._();

  static const AndroidNotificationChannel _leadChannel =
      AndroidNotificationChannel(
        'new_leads',
        'New Leads',
        description: 'Alerts when a new lead arrives.',
        importance: Importance.max,
      );

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );

    await _plugin.initialize(settings: initializationSettings);

    final android = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await android?.createNotificationChannel(_leadChannel);
    await android?.requestNotificationsPermission();
  }

  Future<void> showLeadDetected(Lead lead) async {
    await _plugin.show(
      id: lead.id.hashCode,
      title: 'New lead: ${lead.fullName}',
      body:
          '${lead.serviceInterestedIn} • ${lead.companyName?.trim().isNotEmpty == true ? lead.companyName!.trim() : lead.email}',
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          _leadChannel.id,
          _leadChannel.name,
          channelDescription: _leadChannel.description,
          importance: Importance.max,
          priority: Priority.high,
        ),
      ),
      payload: lead.id,
    );
  }

  Future<void> showRemoteMessage(RemoteMessage message) async {
    final title = message.notification?.title ?? 'New lead received';
    final body =
        message.notification?.body ??
        message.data['serviceInterestedIn'] as String? ??
        'A new lead has been captured.';

    await _plugin.show(
      id: (message.messageId ?? title).hashCode,
      title: title,
      body: body,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          _leadChannel.id,
          _leadChannel.name,
          channelDescription: _leadChannel.description,
          importance: Importance.max,
          priority: Priority.high,
        ),
      ),
    );
  }
}
