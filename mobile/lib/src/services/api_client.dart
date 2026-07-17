import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/lead.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class AppSession {
  const AppSession({
    required this.baseUrl,
    required this.token,
    required this.email,
  });

  final String baseUrl;
  final String token;
  final String email;
}

class LoginResponse {
  const LoginResponse({required this.token, required this.email});

  final String token;
  final String email;
}

class LeadListSummary {
  const LeadListSummary({
    required this.total,
    required this.newCount,
    required this.activeCount,
    required this.wonCount,
  });

  final int total;
  final int newCount;
  final int activeCount;
  final int wonCount;

  const LeadListSummary.empty()
    : total = 0,
      newCount = 0,
      activeCount = 0,
      wonCount = 0;

  factory LeadListSummary.fromJson(Map<String, dynamic> json) {
    return LeadListSummary(
      total: (json['total'] as num?)?.toInt() ?? 0,
      newCount: (json['newCount'] as num?)?.toInt() ?? 0,
      activeCount: (json['activeCount'] as num?)?.toInt() ?? 0,
      wonCount: (json['wonCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class LeadListResponse {
  const LeadListResponse({required this.leads, required this.summary});

  final List<Lead> leads;
  final LeadListSummary summary;
}

class ApiClient {
  const ApiClient({required this.baseUrl, this.token});

  final String baseUrl;
  final String? token;

  Uri _buildUri(String path, [Map<String, String>? queryParameters]) {
    final base = Uri.parse(baseUrl);
    final uri = base.resolve(path);
    if (queryParameters == null || queryParameters.isEmpty) {
      return uri;
    }

    final sanitized = <String, String>{};
    for (final entry in queryParameters.entries) {
      if (entry.value.trim().isNotEmpty) {
        sanitized[entry.key] = entry.value.trim();
      }
    }

    return uri.replace(queryParameters: sanitized.isEmpty ? null : sanitized);
  }

  Map<String, String> _headers({bool includeJson = true}) {
    final headers = <String, String>{'Accept': 'application/json'};
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> _decodeResponse(http.Response response) async {
    final body = utf8.decode(response.bodyBytes);
    final contentType = response.headers['content-type'] ?? '';
    final isJson =
        contentType.contains('application/json') ||
        contentType.contains('+json');
    final Map<String, dynamic> payload;

    if (body.isEmpty) {
      payload = <String, dynamic>{};
    } else if (isJson) {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) {
        payload = decoded;
      } else if (decoded is Map) {
        payload = Map<String, dynamic>.from(decoded);
      } else {
        throw ApiException(
          'Server returned JSON in an unexpected format.',
          statusCode: response.statusCode,
        );
      }
    } else {
      throw ApiException(
        _nonJsonResponseMessage(response, body),
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return payload;
    }

    throw ApiException(
      payload['error'] as String? ??
          'Request failed with status ${response.statusCode}',
      statusCode: response.statusCode,
    );
  }

  String _nonJsonResponseMessage(http.Response response, String body) {
    final location = response.headers['location'];
    final compactBody = body.trim().replaceAll(RegExp(r'\s+'), ' ');
    final looksLikeRedirect =
        response.statusCode >= 300 && response.statusCode < 400 ||
        compactBody.toLowerCase().startsWith('redirecting');

    if (looksLikeRedirect) {
      final destination = location == null ? '' : ' to $location';
      return 'Server redirected$destination. Use the final HTTPS site URL as the Server URL.';
    }

    final preview = compactBody.length > 120
        ? '${compactBody.substring(0, 120)}...'
        : compactBody;

    return preview.isEmpty
        ? 'Server did not return JSON. Check that the Server URL points to this app.'
        : 'Server did not return JSON. Check the Server URL. Response: $preview';
  }

  Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      _buildUri('/api/mobile/auth/login'),
      headers: _headers(),
      body: jsonEncode({'email': email.trim(), 'password': password}),
    );
    final payload = await _decodeResponse(response);
    final user = payload['user'] as Map<String, dynamic>? ?? const {};

    return LoginResponse(
      token: payload['token'] as String,
      email: user['email'] as String? ?? email.trim(),
    );
  }

  Future<void> verifySession() async {
    final response = await http.get(
      _buildUri('/api/mobile/me'),
      headers: _headers(includeJson: false),
    );
    await _decodeResponse(response);
  }

  Future<LeadListResponse> fetchLeads({
    String search = '',
    String status = '',
    String service = '',
  }) async {
    final response = await http.get(
      _buildUri('/api/mobile/leads', {
        'search': search,
        'status': status,
        'service': service,
      }),
      headers: _headers(includeJson: false),
    );
    final payload = await _decodeResponse(response);
    final leadsJson = (payload['leads'] as List<dynamic>? ?? const []);
    final summaryJson =
        payload['summary'] as Map<String, dynamic>? ??
        const <String, dynamic>{};

    return LeadListResponse(
      leads: leadsJson
          .map((item) => Lead.fromJson(item as Map<String, dynamic>))
          .toList(),
      summary: LeadListSummary.fromJson(summaryJson),
    );
  }

  Future<Lead> fetchLead(String id) async {
    final response = await http.get(
      _buildUri('/api/mobile/leads/$id'),
      headers: _headers(includeJson: false),
    );
    final payload = await _decodeResponse(response);
    return Lead.fromJson(payload['lead'] as Map<String, dynamic>);
  }

  Future<Lead> updateLead({
    required String id,
    required String status,
    required String assignedTeamMember,
    required String notes,
  }) async {
    final response = await http.patch(
      _buildUri('/api/mobile/leads/$id'),
      headers: _headers(),
      body: jsonEncode({
        'status': status,
        'assignedTeamMember': assignedTeamMember.trim().isEmpty
            ? null
            : assignedTeamMember.trim(),
        'notes': notes.trim().isEmpty ? null : notes.trim(),
      }),
    );
    final payload = await _decodeResponse(response);
    return Lead.fromJson(payload['lead'] as Map<String, dynamic>);
  }

  Future<void> registerDeviceToken({
    required String tokenValue,
    required String packageName,
    required String deviceName,
    required String appVersion,
  }) async {
    final response = await http.post(
      _buildUri('/api/mobile/device-token'),
      headers: _headers(),
      body: jsonEncode({
        'token': tokenValue,
        'platform': 'android',
        'packageName': packageName,
        'deviceName': deviceName,
        'appVersion': appVersion,
      }),
    );
    await _decodeResponse(response);
  }

  Future<void> unregisterDeviceToken(String tokenValue) async {
    final response = await http.delete(
      _buildUri('/api/mobile/device-token'),
      headers: _headers(),
      body: jsonEncode({'token': tokenValue}),
    );
    await _decodeResponse(response);
  }
}
