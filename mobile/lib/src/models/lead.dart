class Lead {
  const Lead({
    required this.id,
    required this.fullName,
    required this.email,
    required this.serviceInterestedIn,
    required this.message,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.companyName,
    this.phone,
    this.country,
    this.budget,
    this.timeline,
    this.subject,
    this.preferredContactMethod,
    this.websiteUrl,
    this.ipAddress,
    this.userAgent,
    this.referrer,
    this.source,
    this.utmSource,
    this.utmMedium,
    this.utmCampaign,
    this.utmTerm,
    this.utmContent,
    this.notes,
    this.assignedTeamMember,
  });

  final String id;
  final String fullName;
  final String? companyName;
  final String email;
  final String? phone;
  final String? country;
  final String? budget;
  final String? timeline;
  final String serviceInterestedIn;
  final String? subject;
  final String message;
  final String? preferredContactMethod;
  final String? websiteUrl;
  final String? ipAddress;
  final String? userAgent;
  final String? referrer;
  final String? source;
  final String? utmSource;
  final String? utmMedium;
  final String? utmCampaign;
  final String? utmTerm;
  final String? utmContent;
  final String status;
  final String? notes;
  final String? assignedTeamMember;
  final String createdAt;
  final String updatedAt;

  DateTime get createdAtDate =>
      DateTime.tryParse(createdAt)?.toLocal() ??
      DateTime.fromMillisecondsSinceEpoch(0);

  DateTime get updatedAtDate =>
      DateTime.tryParse(updatedAt)?.toLocal() ??
      DateTime.fromMillisecondsSinceEpoch(0);

  String get displayCompany => companyName?.trim().isNotEmpty == true
      ? companyName!.trim()
      : 'No company provided';

  Lead copyWith({
    String? status,
    String? notes,
    String? assignedTeamMember,
    String? updatedAt,
  }) {
    return Lead(
      id: id,
      fullName: fullName,
      companyName: companyName,
      email: email,
      phone: phone,
      country: country,
      budget: budget,
      timeline: timeline,
      serviceInterestedIn: serviceInterestedIn,
      subject: subject,
      message: message,
      preferredContactMethod: preferredContactMethod,
      websiteUrl: websiteUrl,
      ipAddress: ipAddress,
      userAgent: userAgent,
      referrer: referrer,
      source: source,
      utmSource: utmSource,
      utmMedium: utmMedium,
      utmCampaign: utmCampaign,
      utmTerm: utmTerm,
      utmContent: utmContent,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      assignedTeamMember: assignedTeamMember ?? this.assignedTeamMember,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory Lead.fromJson(Map<String, dynamic> json) {
    return Lead(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      companyName: json['companyName'] as String?,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      country: json['country'] as String?,
      budget: json['budget'] as String?,
      timeline: json['timeline'] as String?,
      serviceInterestedIn: json['serviceInterestedIn'] as String,
      subject: json['subject'] as String?,
      message: json['message'] as String,
      preferredContactMethod: json['preferredContactMethod'] as String?,
      websiteUrl: json['websiteUrl'] as String?,
      ipAddress: json['ipAddress'] as String?,
      userAgent: json['userAgent'] as String?,
      referrer: json['referrer'] as String?,
      source: json['source'] as String?,
      utmSource: json['utmSource'] as String?,
      utmMedium: json['utmMedium'] as String?,
      utmCampaign: json['utmCampaign'] as String?,
      utmTerm: json['utmTerm'] as String?,
      utmContent: json['utmContent'] as String?,
      status: json['status'] as String,
      notes: json['notes'] as String?,
      assignedTeamMember: json['assignedTeamMember'] as String?,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}
