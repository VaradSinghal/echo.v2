-- Add priority_score and actionable_summary to feedback_analysis
ALTER TABLE public.feedback_analysis 
ADD COLUMN IF NOT EXISTS priority_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS actionable_summary TEXT;

-- Update RLS if necessary (it should already be enabled and allowing selects)
-- No changes needed to RLS as we are just adding columns to an existing table.
