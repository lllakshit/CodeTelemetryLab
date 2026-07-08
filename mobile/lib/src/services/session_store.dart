import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class SessionStore {
  const SessionStore();

  static const _tokenKey = 'session.token';
  static const _emailKey = 'session.email';
  static const _baseUrlKey = 'session.baseUrl';
  static const _latestLeadIdKey = 'lead.latestId';

  Future<SharedPreferences> get _prefs async => SharedPreferences.getInstance();

  Future<String?> readBaseUrl() async {
    final prefs = await _prefs;
    return prefs.getString(_baseUrlKey);
  }

  Future<void> writeBaseUrl(String baseUrl) async {
    final prefs = await _prefs;
    await prefs.setString(_baseUrlKey, baseUrl);
  }

  Future<AppSession?> readSession() async {
    final prefs = await _prefs;
    final token = prefs.getString(_tokenKey);
    final email = prefs.getString(_emailKey);
    final baseUrl = prefs.getString(_baseUrlKey);

    if (token == null || email == null || baseUrl == null) {
      return null;
    }

    return AppSession(baseUrl: baseUrl, token: token, email: email);
  }

  Future<void> writeSession(AppSession session) async {
    final prefs = await _prefs;
    await prefs.setString(_tokenKey, session.token);
    await prefs.setString(_emailKey, session.email);
    await prefs.setString(_baseUrlKey, session.baseUrl);
  }

  Future<void> clearSession() async {
    final prefs = await _prefs;
    await prefs.remove(_tokenKey);
    await prefs.remove(_emailKey);
  }

  Future<String?> readLatestLeadId() async {
    final prefs = await _prefs;
    return prefs.getString(_latestLeadIdKey);
  }

  Future<void> writeLatestLeadId(String leadId) async {
    final prefs = await _prefs;
    await prefs.setString(_latestLeadIdKey, leadId);
  }
}
