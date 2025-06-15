/**
 * External System Integration Types
 * Defines types for LMS, SSO, Webhook, and AI integrations
 */

// Base Integration Types
export interface BaseIntegration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  teamId: string;
  config: Record<string, any>;
  credentials: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  metadata?: Record<string, any>;
}

export type IntegrationType =
  | 'lms'
  | 'sso'
  | 'webhook'
  | 'ai'
  | 'notification'
  | 'storage'
  | 'analytics';

export type IntegrationStatus =
  | 'active'
  | 'inactive'
  | 'error'
  | 'pending'
  | 'syncing';

// LMS Integration Types
export interface LMSIntegration extends BaseIntegration {
  type: 'lms';
  provider: LMSProvider;
  config: LMSConfig;
  credentials: LMSCredentials;
  features: LMSFeature[];
}

export type LMSProvider =
  | 'google-classroom'
  | 'canvas'
  | 'moodle'
  | 'blackboard'
  | 'schoology'
  | 'brightspace';

export interface LMSConfig {
  baseUrl?: string;
  instanceId?: string;
  syncInterval: number; // minutes
  autoSync: boolean;
  syncRosters: boolean;
  syncGrades: boolean;
  syncAssignments: boolean;
  gradeMappingRules: GradeMappingRule[];
}

export interface LMSCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  domain?: string;
}

export type LMSFeature =
  | 'roster_sync'
  | 'grade_passback'
  | 'assignment_sync'
  | 'course_sync'
  | 'user_sync'
  | 'content_sync';

export interface GradeMappingRule {
  examForgeScore: number;
  lmsGrade: string | number;
  condition?: 'gte' | 'lte' | 'eq';
}

// SSO Integration Types
export interface SSOIntegration extends BaseIntegration {
  type: 'sso';
  provider: SSOProvider;
  config: SSOConfig;
  credentials: SSOCredentials;
}

export type SSOProvider =
  | 'saml'
  | 'ldap'
  | 'oauth2'
  | 'oidc'
  | 'active-directory'
  | 'azure-ad'
  | 'okta'
  | 'auth0';

export interface SSOConfig {
  entityId?: string;
  ssoUrl?: string;
  sloUrl?: string;
  certificateFingerprint?: string;
  attributeMapping: AttributeMapping;
  autoProvision: boolean;
  defaultRole: string;
  domainRestriction?: string[];
}

export interface SSOCredentials {
  certificate?: string;
  privateKey?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  discoveryUrl?: string;
}

export interface AttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  role?: string;
  department?: string;
  groups?: string;
}

// Webhook Integration Types
export interface WebhookIntegration extends BaseIntegration {
  type: 'webhook';
  config: WebhookConfig;
  events: WebhookEvent[];
  deliveryUrl: string;
  secret: string;
}

export interface WebhookConfig {
  retryAttempts: number;
  retryDelay: number; // seconds
  timeout: number; // seconds
  verifySSL: boolean;
  customHeaders?: Record<string, string>;
  authType?: 'none' | 'bearer' | 'basic' | 'hmac';
  authValue?: string;
}

export type WebhookEvent =
  | 'quiz.created'
  | 'quiz.updated'
  | 'quiz.deleted'
  | 'quiz.published'
  | 'response.submitted'
  | 'response.graded'
  | 'user.created'
  | 'user.updated'
  | 'team.created'
  | 'team.updated'
  | 'certificate.issued'
  | 'certificate.revoked';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  team: {
    id: string;
    name: string;
  };
  signature?: string;
}

// AI Integration Types
export interface AIIntegration extends BaseIntegration {
  type: 'ai';
  provider: AIProvider;
  config: AIConfig;
  credentials: AICredentials;
  usage: AIUsage;
}

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google-ai'
  | 'azure-openai'
  | 'custom';

export interface AIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  features: AIFeature[];
  rateLimits: AIRateLimit;
  contentFilters: boolean;
  language: string;
}

export interface AICredentials {
  apiKey: string;
  endpoint?: string;
  region?: string;
  deploymentName?: string;
}

export type AIFeature =
  | 'question_generation'
  | 'content_analysis'
  | 'auto_grading'
  | 'translation'
  | 'plagiarism_detection'
  | 'feedback_generation';

export interface AIRateLimit {
  requestsPerMinute: number;
  tokensPerMinute: number;
  dailyLimit: number;
}

export interface AIUsage {
  requestsToday: number;
  tokensToday: number;
  costToday: number;
  lastRequestAt?: Date;
}

// Integration Sync Types
export interface SyncOperation {
  id: string;
  integrationId: string;
  type: SyncType;
  status: SyncStatus;
  direction: SyncDirection;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export type SyncType =
  | 'roster'
  | 'grades'
  | 'assignments'
  | 'courses'
  | 'users'
  | 'content';

export type SyncStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';

export interface SyncError {
  recordId?: string;
  message: string;
  code: string;
  details?: Record<string, any>;
}

// API Integration Types
export interface ExternalAPIConfig {
  baseUrl: string;
  version?: string;
  timeout: number;
  retryConfig: RetryConfig;
  authConfig: APIAuthConfig;
  rateLimitConfig: RateLimitConfig;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface APIAuthConfig {
  type: 'oauth2' | 'bearer' | 'basic' | 'api-key' | 'hmac';
  credentials: Record<string, string>;
  refreshUrl?: string;
  scope?: string[];
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  burstLimit: number;
  timeWindow: number;
}

// Integration Event Types
export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: IntegrationEventType;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
  duration?: number;
}

export type IntegrationEventType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'auth_renewed'
  | 'auth_failed'
  | 'webhook_delivered'
  | 'webhook_failed'
  | 'rate_limit_exceeded'
  | 'quota_exceeded';

// Integration Management Types
export interface IntegrationSettings {
  teamId: string;
  maxIntegrations: number;
  allowedProviders: string[];
  securityPolicies: SecurityPolicy[];
  auditLogging: boolean;
  dataRetentionDays: number;
}

export interface SecurityPolicy {
  type: 'ip_whitelist' | 'domain_restriction' | 'encryption_required';
  value: string | string[];
  enforced: boolean;
}

// External API Response Types
export interface LMSUser {
  id: string;
  email: string;
  name: string;
  role: string;
  courses: string[];
  metadata?: Record<string, any>;
}

export interface LMSCourse {
  id: string;
  name: string;
  code: string;
  instructors: string[];
  students: string[];
  metadata?: Record<string, any>;
}

export interface LMSAssignment {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  dueDate?: Date;
  maxScore: number;
  published: boolean;
  metadata?: Record<string, any>;
}

export interface GradePassback {
  userId: string;
  assignmentId: string;
  score: number;
  maxScore: number;
  submittedAt: Date;
  feedback?: string;
}
