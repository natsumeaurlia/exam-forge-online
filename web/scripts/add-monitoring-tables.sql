-- Backup metadata table
CREATE TABLE IF NOT EXISTS backup_metadata (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    filename VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('full', 'incremental')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed')),
    s3_key VARCHAR(1000),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_metadata_timestamp ON backup_metadata(timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_status ON backup_metadata(status);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_type ON backup_metadata(type);

-- Restore points table
CREATE TABLE IF NOT EXISTS restore_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    backup_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (backup_id) REFERENCES backup_metadata(id)
);

CREATE INDEX IF NOT EXISTS idx_restore_points_created_at ON restore_points(created_at);

-- Restore log table
CREATE TABLE IF NOT EXISTS restore_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    restored_tables JSONB,
    errors JSONB,
    duration INTEGER, -- milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (backup_id) REFERENCES backup_metadata(id)
);

CREATE INDEX IF NOT EXISTS idx_restore_log_created_at ON restore_log(created_at);
CREATE INDEX IF NOT EXISTS idx_restore_log_success ON restore_log(success);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    cpu_usage DECIMAL(5,2),
    memory_percentage DECIMAL(5,2),
    disk_percentage DECIMAL(5,2),
    db_connections INTEGER,
    db_response_time DECIMAL(10,3),
    uptime INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

-- Error reports table
CREATE TABLE IF NOT EXISTS error_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'fatal')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    stack JSONB,
    context JSONB,
    tags JSONB,
    extra JSONB,
    breadcrumbs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_reports_fingerprint ON error_reports(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_reports_timestamp ON error_reports(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_reports_level ON error_reports(level);

-- Error aggregations table
CREATE TABLE IF NOT EXISTS error_aggregations (
    fingerprint VARCHAR(255) PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    count INTEGER DEFAULT 1,
    first_seen TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    assigned_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_aggregations_last_seen ON error_aggregations(last_seen);
CREATE INDEX IF NOT EXISTS idx_error_aggregations_resolved ON error_aggregations(resolved);
CREATE INDEX IF NOT EXISTS idx_error_aggregations_level ON error_aggregations(level);

-- Health check results table (optional - for persistence)
CREATE TABLE IF NOT EXISTS health_check_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    response_time DECIMAL(10,3) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    details JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_check_timestamp ON health_check_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_health_check_service ON health_check_results(service);
CREATE INDEX IF NOT EXISTS idx_health_check_status ON health_check_results(status);

-- Alert configurations table
CREATE TABLE IF NOT EXISTS alert_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('threshold', 'availability', 'error_rate')),
    metric VARCHAR(255) NOT NULL,
    threshold DECIMAL(10,3) NOT NULL,
    comparison VARCHAR(10) NOT NULL CHECK (comparison IN ('>', '<', '=', '>=', '<=')),
    duration INTEGER NOT NULL, -- seconds
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    channels JSONB NOT NULL, -- array of notification channels
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_configs_enabled ON alert_configs(enabled);

-- Alert history table
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    metric_value DECIMAL(10,3),
    notification_sent BOOLEAN DEFAULT FALSE,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (config_id) REFERENCES alert_configs(id)
);

CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at);
CREATE INDEX IF NOT EXISTS idx_alert_history_config_id ON alert_history(config_id);

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time INTEGER NOT NULL, -- milliseconds
    status_code INTEGER NOT NULL,
    user_id VARCHAR(255),
    team_id VARCHAR(255),
    error_count INTEGER DEFAULT 0,
    memory_usage BIGINT, -- bytes
    cpu_usage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_status ON performance_metrics(status_code);