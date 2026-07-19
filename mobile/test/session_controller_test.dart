import 'package:flutter_test/flutter_test.dart';
import 'package:leads/src/app.dart';

void main() {
  group('SessionController.normalizeBaseUrl', () {
    test('uses HTTPS for hosted domains without a scheme', () {
      expect(
        SessionController.normalizeBaseUrl('www.codetelemetrylab.me'),
        'https://www.codetelemetrylab.me',
      );
    });

    test('upgrades hosted HTTP URLs to HTTPS to avoid API redirects', () {
      expect(
        SessionController.normalizeBaseUrl('http://www.codetelemetrylab.me'),
        'https://www.codetelemetrylab.me',
      );
    });

    test('keeps local emulator URLs on HTTP', () {
      expect(
        SessionController.normalizeBaseUrl('localhost:3000'),
        'http://10.0.2.2:3000',
      );
      expect(
        SessionController.normalizeBaseUrl('10.0.2.2:3000'),
        'http://10.0.2.2:3000',
      );
    });

    test('removes paths and trailing slashes from the server root', () {
      expect(
        SessionController.normalizeBaseUrl(
          'https://www.codetelemetrylab.me/api/mobile/',
        ),
        'https://www.codetelemetrylab.me',
      );
    });
  });
}
