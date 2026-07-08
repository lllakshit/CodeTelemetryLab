import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'models/lead.dart';
import 'services/api_client.dart';
import 'services/notification_service.dart';
import 'services/push_token_service.dart';
import 'services/session_store.dart';

const List<String> leadStatuses = <String>[
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Won',
  'Lost',
  'Archived',
];

class LeadDeskApp extends StatefulWidget {
  const LeadDeskApp({super.key});

  @override
  State<LeadDeskApp> createState() => _LeadDeskAppState();
}

class _LeadDeskAppState extends State<LeadDeskApp> {
  late final SessionController _sessionController;

  @override
  void initState() {
    super.initState();
    _sessionController = SessionController(const SessionStore());
    unawaited(_sessionController.initialize());
  }

  @override
  void dispose() {
    _sessionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _sessionController,
      builder: (context, _) {
        return MaterialApp(
          title: 'Lead Desk',
          debugShowCheckedModeBanner: false,
          theme: _buildTheme(),
          home: _sessionController.initialized
              ? (_sessionController.session == null
                    ? LoginScreen(controller: _sessionController)
                    : LeadHomeScreen(controller: _sessionController))
              : const SplashScreen(),
        );
      },
    );
  }
}

ThemeData _buildTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF0A66C2),
    brightness: Brightness.light,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: const Color(0xFFF3F6FB),
    appBarTheme: const AppBarTheme(
      centerTitle: false,
      backgroundColor: Color(0xFFF3F6FB),
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: Color(0xFFE1E8F0)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFD7E0EA)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Color(0xFFD7E0EA)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: colorScheme.primary, width: 1.4),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
  );
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: SizedBox(
          width: 28,
          height: 28,
          child: CircularProgressIndicator(strokeWidth: 2.4),
        ),
      ),
    );
  }
}

class SessionController extends ChangeNotifier {
  SessionController(this._store);

  final SessionStore _store;

  bool initialized = false;
  bool busy = false;
  String? errorMessage;
  AppSession? session;
  String serverBaseUrl = 'http://10.0.2.2:3000';

  Future<void> initialize() async {
    serverBaseUrl = await _store.readBaseUrl() ?? serverBaseUrl;
    session = await _store.readSession();

    if (session != null) {
      try {
        await apiClient.verifySession();
        await PushTokenService.instance.syncRegistration(apiClient);
      } catch (_) {
        session = null;
        await _store.clearSession();
      }
    }

    initialized = true;
    notifyListeners();
  }

  ApiClient get apiClient => ApiClient(
    baseUrl: session?.baseUrl ?? serverBaseUrl,
    token: session?.token,
  );

  Future<void> signIn({
    required String email,
    required String password,
    required String baseUrl,
  }) async {
    busy = true;
    errorMessage = null;
    notifyListeners();

    try {
      final normalizedBaseUrl = normalizeBaseUrl(baseUrl);
      final client = ApiClient(baseUrl: normalizedBaseUrl);
      final response = await client.login(email: email, password: password);

      final nextSession = AppSession(
        baseUrl: normalizedBaseUrl,
        token: response.token,
        email: response.email,
      );

      session = nextSession;
      serverBaseUrl = normalizedBaseUrl;
      await _store.writeSession(nextSession);
      await _store.writeBaseUrl(normalizedBaseUrl);
      await PushTokenService.instance.syncRegistration(apiClient);
    } on ApiException catch (error) {
      errorMessage = error.message;
    } catch (error) {
      errorMessage = 'Unable to sign in. ${error.toString()}';
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    final existingSession = session;
    if (existingSession != null) {
      await PushTokenService.instance.unregister(
        ApiClient(
          baseUrl: existingSession.baseUrl,
          token: existingSession.token,
        ),
      );
    }

    session = null;
    errorMessage = null;
    await _store.clearSession();
    notifyListeners();
  }

  static String normalizeBaseUrl(String value) {
    final raw = value.trim();
    if (raw.isEmpty) {
      throw const FormatException('Please enter the server URL.');
    }

    final withScheme = raw.contains('://') ? raw : 'http://$raw';
    final uri = Uri.parse(withScheme);
    final host = switch (uri.host) {
      'localhost' || '127.0.0.1' => '10.0.2.2',
      _ => uri.host,
    };

    return uri
        .replace(
          scheme: uri.scheme.isEmpty ? 'http' : uri.scheme,
          host: host,
          path: uri.path == '/' ? '' : uri.path,
        )
        .toString()
        .replaceFirst(RegExp(r'/$'), '');
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.controller});

  final SessionController controller;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final TextEditingController _baseUrlController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _baseUrlController = TextEditingController(
      text: widget.controller.serverBaseUrl,
    );
    _emailController = TextEditingController(
      text: widget.controller.session?.email ?? 'admin@codetelemetrylabs.com',
    );
    _passwordController = TextEditingController(text: 'admin1234');
  }

  @override
  void dispose() {
    _baseUrlController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await widget.controller.signIn(
      email: _emailController.text,
      password: _passwordController.text,
      baseUrl: _baseUrlController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F1FF),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: const Icon(
                            Icons.track_changes_outlined,
                            color: Color(0xFF0A66C2),
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'Lead Desk',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Internal Android app for live lead review, updates, and follow-up.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: const Color(0xFF536273)),
                        ),
                        const SizedBox(height: 24),
                        TextFormField(
                          controller: _baseUrlController,
                          keyboardType: TextInputType.url,
                          decoration: const InputDecoration(
                            labelText: 'Server URL',
                            hintText: 'http://10.0.2.2:3000',
                          ),
                          validator: (value) =>
                              value == null || value.trim().isEmpty
                              ? 'Enter the local server URL'
                              : null,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Admin email',
                          ),
                          validator: (value) =>
                              value == null || !value.contains('@')
                              ? 'Enter a valid email'
                              : null,
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Password',
                          ),
                          validator: (value) => value == null || value.isEmpty
                              ? 'Enter the password'
                              : null,
                          onFieldSubmitted: (_) => _submit(),
                        ),
                        const SizedBox(height: 18),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFD),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFE1E8F0)),
                          ),
                          child: const Text(
                            'Tip: on the Android emulator, localhost is mapped to 10.0.2.2.',
                            style: TextStyle(
                              color: Color(0xFF536273),
                              height: 1.5,
                            ),
                          ),
                        ),
                        if (controller.errorMessage != null) ...[
                          const SizedBox(height: 16),
                          Text(
                            controller.errorMessage!,
                            style: const TextStyle(color: Colors.redAccent),
                          ),
                        ],
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: controller.busy ? null : _submit,
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                            ),
                            child: controller.busy
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text('Sign in to Lead Desk'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class LeadHomeScreen extends StatefulWidget {
  const LeadHomeScreen({super.key, required this.controller});

  final SessionController controller;

  @override
  State<LeadHomeScreen> createState() => _LeadHomeScreenState();
}

class _LeadHomeScreenState extends State<LeadHomeScreen> {
  late final LeadListController _leadController;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _leadController = LeadListController(
      apiClient: widget.controller.apiClient,
      store: const SessionStore(),
    );
    unawaited(_leadController.initialize());
  }

  @override
  void dispose() {
    _leadController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openLead(Lead lead) async {
    final updatedLead = await Navigator.of(context).push<Lead>(
      MaterialPageRoute(
        builder: (_) =>
            LeadDetailScreen(lead: lead, controller: _leadController),
      ),
    );

    if (updatedLead != null) {
      _leadController.applyUpdatedLead(updatedLead);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _leadController,
      builder: (context, _) {
        final leads = _leadController.leads;

        return Scaffold(
          appBar: AppBar(
            title: const Text(
              'Lead Desk',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            actions: [
              IconButton(
                tooltip: 'Refresh',
                onPressed: () => _leadController.refresh(),
                icon: const Icon(Icons.refresh_rounded),
              ),
              IconButton(
                tooltip: 'Sign out',
                onPressed: widget.controller.signOut,
                icon: const Icon(Icons.logout_rounded),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: _leadController.refresh,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
              children: [
                Text(
                  'Connected to ${widget.controller.session?.baseUrl ?? widget.controller.serverBaseUrl}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF536273),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    SummaryCard(
                      label: 'Total leads',
                      value: _leadController.summary.total.toString(),
                    ),
                    SummaryCard(
                      label: 'New',
                      value: _leadController.summary.newCount.toString(),
                    ),
                    SummaryCard(
                      label: 'Active',
                      value: _leadController.summary.activeCount.toString(),
                    ),
                    SummaryCard(
                      label: 'Won',
                      value: _leadController.summary.wonCount.toString(),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        TextField(
                          controller: _searchController,
                          decoration: const InputDecoration(
                            labelText: 'Search leads',
                            hintText: 'Name, company, email',
                            prefixIcon: Icon(Icons.search_rounded),
                          ),
                          onSubmitted: (_) => _leadController.applyFilters(
                            search: _searchController.text,
                          ),
                        ),
                        const SizedBox(height: 12),
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final statusField = DropdownButtonFormField<String>(
                              key: ValueKey(
                                'status:${_leadController.statusFilter}',
                              ),
                              initialValue: _leadController.statusFilter.isEmpty
                                  ? ''
                                  : _leadController.statusFilter,
                              isExpanded: true,
                              items: [
                                const DropdownMenuItem(
                                  value: '',
                                  child: Text('All statuses'),
                                ),
                                ...leadStatuses.map(
                                  (status) => DropdownMenuItem(
                                    value: status,
                                    child: Text(status),
                                  ),
                                ),
                              ],
                              onChanged: (value) => _leadController
                                  .applyFilters(status: value ?? ''),
                              decoration: const InputDecoration(
                                labelText: 'Status',
                              ),
                            );

                            final serviceField =
                                DropdownButtonFormField<String>(
                                  key: ValueKey(
                                    'service:${_leadController.serviceFilter}',
                                  ),
                                  initialValue:
                                      _leadController.serviceFilter.isEmpty
                                      ? ''
                                      : _leadController.serviceFilter,
                                  isExpanded: true,
                                  items: [
                                    const DropdownMenuItem(
                                      value: '',
                                      child: Text('All services'),
                                    ),
                                    ..._leadController.serviceOptions.map(
                                      (service) => DropdownMenuItem(
                                        value: service,
                                        child: Text(service),
                                      ),
                                    ),
                                  ],
                                  onChanged: (value) => _leadController
                                      .applyFilters(service: value ?? ''),
                                  decoration: const InputDecoration(
                                    labelText: 'Service',
                                  ),
                                );

                            if (constraints.maxWidth < 720) {
                              return Column(
                                children: [
                                  statusField,
                                  const SizedBox(height: 12),
                                  serviceField,
                                ],
                              );
                            }

                            return Row(
                              children: [
                                Expanded(child: statusField),
                                const SizedBox(width: 12),
                                Expanded(child: serviceField),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (_leadController.errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      _leadController.errorMessage!,
                      style: const TextStyle(color: Colors.redAccent),
                    ),
                  ),
                if (_leadController.loading && leads.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 80),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (leads.isEmpty)
                  EmptyState(lastUpdated: _leadController.lastUpdated)
                else
                  ...leads.map(
                    (lead) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: LeadCard(lead: lead, onTap: () => _openLead(lead)),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class LeadListController extends ChangeNotifier {
  LeadListController({required this._apiClient, required this._store});

  final ApiClient _apiClient;
  final SessionStore _store;
  final Set<String> _serviceOptionSet = <String>{};

  List<Lead> leads = const [];
  LeadListSummary summary = const LeadListSummary.empty();
  bool loading = false;
  String? errorMessage;
  DateTime? lastUpdated;
  String searchFilter = '';
  String statusFilter = '';
  String serviceFilter = '';
  Timer? _pollingTimer;
  bool _hasLoadedOnce = false;

  List<String> get serviceOptions {
    final options = _serviceOptionSet.toList()..sort();
    return options;
  }

  Future<void> initialize() async {
    await refresh();
    _pollingTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => unawaited(refresh(silent: true)),
    );
  }

  Future<void> refresh({bool silent = false}) async {
    if (!silent) {
      loading = true;
      notifyListeners();
    }

    errorMessage = null;

    try {
      final previousLeadId = leads.isNotEmpty
          ? leads.first.id
          : await _store.readLatestLeadId();
      final response = await _apiClient.fetchLeads(
        search: searchFilter,
        status: statusFilter,
        service: serviceFilter,
      );

      leads = response.leads;
      summary = response.summary;
      lastUpdated = DateTime.now();
      _serviceOptionSet.addAll(
        response.leads.map((lead) => lead.serviceInterestedIn),
      );

      if (response.leads.isNotEmpty) {
        final newestLead = response.leads.first;
        final latestSeenLeadId = await _store.readLatestLeadId();

        if (_hasLoadedOnce &&
            latestSeenLeadId != null &&
            latestSeenLeadId != newestLead.id &&
            previousLeadId != newestLead.id) {
          await NotificationService.instance.showLeadDetected(newestLead);
        }

        await _store.writeLatestLeadId(newestLead.id);
      }

      _hasLoadedOnce = true;
    } on ApiException catch (error) {
      errorMessage = error.message;
    } catch (error) {
      errorMessage = 'Failed to load leads. ${error.toString()}';
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> applyFilters({
    String? search,
    String? status,
    String? service,
  }) async {
    searchFilter = search ?? searchFilter;
    statusFilter = status ?? statusFilter;
    serviceFilter = service ?? serviceFilter;
    await refresh();
  }

  Future<Lead> updateLead({
    required String id,
    required String status,
    required String assignedTeamMember,
    required String notes,
  }) async {
    final updatedLead = await _apiClient.updateLead(
      id: id,
      status: status,
      assignedTeamMember: assignedTeamMember,
      notes: notes,
    );
    applyUpdatedLead(updatedLead);
    return updatedLead;
  }

  void applyUpdatedLead(Lead lead) {
    leads = [
      for (final item in leads)
        if (item.id == lead.id) lead else item,
    ];
    summary = LeadListSummary(
      total: leads.length,
      newCount: leads.where((item) => item.status == 'New').length,
      activeCount: leads
          .where((item) => !['Lost', 'Archived', 'Won'].contains(item.status))
          .length,
      wonCount: leads.where((item) => item.status == 'Won').length,
    );
    notifyListeners();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

class LeadCard extends StatelessWidget {
  const LeadCard({super.key, required this.lead, required this.onTap});

  final Lead lead;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('MMM d, h:mm a');

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusPill(
                    text: lead.serviceInterestedIn,
                    background: const Color(0xFFE8F1FF),
                    foreground: const Color(0xFF0A66C2),
                  ),
                  StatusPill(
                    text: lead.status,
                    background: _statusBackground(lead.status),
                    foreground: _statusForeground(lead.status),
                  ),
                  StatusPill(
                    text: formatter.format(lead.createdAtDate),
                    background: const Color(0xFFF4F6F8),
                    foreground: const Color(0xFF536273),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                lead.fullName,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              Text(
                '${lead.displayCompany} • ${lead.email}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF536273),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                lead.message,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(height: 1.45),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      lead.budget?.trim().isNotEmpty == true
                          ? 'Budget: ${lead.budget}'
                          : 'Budget not provided',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF536273),
                      ),
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LeadDetailScreen extends StatefulWidget {
  const LeadDetailScreen({
    super.key,
    required this.lead,
    required this.controller,
  });

  final Lead lead;
  final LeadListController controller;

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  late String _status;
  late final TextEditingController _assignedController;
  late final TextEditingController _notesController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _status = widget.lead.status;
    _assignedController = TextEditingController(
      text: widget.lead.assignedTeamMember ?? '',
    );
    _notesController = TextEditingController(text: widget.lead.notes ?? '');
  }

  @override
  void dispose() {
    _assignedController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _saveLead() async {
    setState(() {
      _saving = true;
    });

    try {
      final updatedLead = await widget.controller.updateLead(
        id: widget.lead.id,
        status: _status,
        assignedTeamMember: _assignedController.text,
        notes: _notesController.text,
      );

      if (!mounted) {
        return;
      }

      Navigator.of(context).pop(updatedLead);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Unable to save lead. $error')));
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lead = widget.lead;
    final formatter = DateFormat('MMM d, yyyy h:mm a');

    return Scaffold(
      appBar: AppBar(title: Text(lead.fullName)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      StatusPill(
                        text: lead.serviceInterestedIn,
                        background: const Color(0xFFE8F1FF),
                        foreground: const Color(0xFF0A66C2),
                      ),
                      StatusPill(
                        text: _status,
                        background: _statusBackground(_status),
                        foreground: _statusForeground(_status),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    lead.subject?.trim().isNotEmpty == true
                        ? lead.subject!
                        : 'Project inquiry',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Created ${formatter.format(lead.createdAtDate)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF536273),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          InfoSection(
            title: 'Contact',
            children: [
              InfoRow(label: 'Email', value: lead.email),
              InfoRow(label: 'Phone', value: lead.phone),
              InfoRow(label: 'Company', value: lead.companyName),
              InfoRow(label: 'Country', value: lead.country),
              InfoRow(
                label: 'Preferred contact',
                value: lead.preferredContactMethod,
              ),
              InfoRow(label: 'Website', value: lead.websiteUrl),
            ],
          ),
          const SizedBox(height: 12),
          InfoSection(
            title: 'Opportunity',
            children: [
              InfoRow(label: 'Service', value: lead.serviceInterestedIn),
              InfoRow(label: 'Budget', value: lead.budget),
              InfoRow(label: 'Timeline', value: lead.timeline),
              InfoRow(label: 'Source', value: lead.source),
            ],
          ),
          const SizedBox(height: 12),
          InfoSection(
            title: 'Message',
            children: [
              Text(
                lead.message,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(height: 1.55),
              ),
            ],
          ),
          const SizedBox(height: 12),
          InfoSection(
            title: 'Internal management',
            children: [
              DropdownButtonFormField<String>(
                key: ValueKey('detail:$_status'),
                initialValue: _status,
                isExpanded: true,
                items: leadStatuses
                    .map(
                      (status) =>
                          DropdownMenuItem(value: status, child: Text(status)),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value == null) {
                    return;
                  }
                  setState(() {
                    _status = value;
                  });
                },
                decoration: const InputDecoration(labelText: 'Status'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _assignedController,
                decoration: const InputDecoration(
                  labelText: 'Assigned team member',
                  hintText: 'Owner name',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _notesController,
                maxLines: 5,
                decoration: const InputDecoration(
                  labelText: 'Internal notes',
                  hintText: 'Qualification notes, next step, proposal context',
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _saveLead,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  child: _saving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Save lead changes'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          InfoSection(
            title: 'Submission metadata',
            children: [
              InfoRow(label: 'Referrer', value: lead.referrer),
              InfoRow(label: 'IP address', value: lead.ipAddress),
              InfoRow(label: 'UTM source', value: lead.utmSource),
              InfoRow(label: 'UTM medium', value: lead.utmMedium),
              InfoRow(label: 'UTM campaign', value: lead.utmCampaign),
              InfoRow(label: 'UTM term', value: lead.utmTerm),
              InfoRow(label: 'UTM content', value: lead.utmContent),
            ],
          ),
        ],
      ),
    );
  }
}

class SummaryCard extends StatelessWidget {
  const SummaryCard({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 152,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: const Color(0xFF536273)),
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, this.lastUpdated});

  final DateTime? lastUpdated;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            const Icon(
              Icons.inbox_outlined,
              size: 42,
              color: Color(0xFF536273),
            ),
            const SizedBox(height: 12),
            Text(
              'No leads match the current filters.',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            if (lastUpdated != null) ...[
              const SizedBox(height: 8),
              Text(
                'Last checked ${DateFormat('MMM d, h:mm a').format(lastUpdated!)}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: const Color(0xFF536273)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class InfoSection extends StatelessWidget {
  const InfoSection({super.key, required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 14),
            ...children,
          ],
        ),
      ),
    );
  }
}

class InfoRow extends StatelessWidget {
  const InfoRow({super.key, required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: const Color(0xFF536273)),
            ),
          ),
          Expanded(
            child: Text(
              value?.trim().isNotEmpty == true ? value!.trim() : 'Not provided',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({
    super.key,
    required this.text,
    required this.background,
    required this.foreground,
  });

  final String text;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: foreground,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

Color _statusBackground(String status) {
  return switch (status) {
    'Won' => const Color(0xFFE7F8EE),
    'Lost' || 'Archived' => const Color(0xFFF2F3F5),
    'Proposal Sent' => const Color(0xFFFFF1D8),
    'Qualified' => const Color(0xFFE8F1FF),
    'Contacted' => const Color(0xFFF0ECFF),
    _ => const Color(0xFFE7F4FF),
  };
}

Color _statusForeground(String status) {
  return switch (status) {
    'Won' => const Color(0xFF157347),
    'Lost' || 'Archived' => const Color(0xFF5E6875),
    'Proposal Sent' => const Color(0xFFAA6A00),
    'Qualified' => const Color(0xFF0A66C2),
    'Contacted' => const Color(0xFF6E44C7),
    _ => const Color(0xFF0A66C2),
  };
}
