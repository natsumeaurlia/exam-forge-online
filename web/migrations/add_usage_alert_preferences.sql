-- Migration to add usage alert preferences to notification_preferences table

-- Add new columns for usage alerts
ALTER TABLE notification_preferences 
ADD COLUMN usage_alerts BOOLEAN DEFAULT true,
ADD COLUMN usage_warning_threshold INTEGER DEFAULT 75,
ADD COLUMN usage_critical_threshold INTEGER DEFAULT 90;

-- Add constraint to ensure thresholds are valid
ALTER TABLE notification_preferences 
ADD CONSTRAINT check_warning_threshold CHECK (usage_warning_threshold >= 0 AND usage_warning_threshold <= 100),
ADD CONSTRAINT check_critical_threshold CHECK (usage_critical_threshold >= 0 AND usage_critical_threshold <= 100),
ADD CONSTRAINT check_threshold_order CHECK (usage_warning_threshold < usage_critical_threshold);

-- Update existing records to have default values
UPDATE notification_preferences 
SET 
  usage_alerts = true,
  usage_warning_threshold = 75,
  usage_critical_threshold = 90
WHERE usage_alerts IS NULL;