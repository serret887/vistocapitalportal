-- =====================================================
-- CONDITIONS SYSTEM MIGRATION
-- =====================================================

-- Create conditions table
CREATE TABLE IF NOT EXISTS application_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'revision_requested')),
  condition_type TEXT NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conditions activity log table
CREATE TABLE IF NOT EXISTS condition_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES application_conditions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for conditions
ALTER TABLE application_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_activities ENABLE ROW LEVEL SECURITY;

-- Policy for application_conditions
CREATE POLICY "Users can view conditions for their applications" ON application_conditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM loan_applications la
      JOIN partner_profiles pp ON la.partner_id = pp.id
      WHERE la.id = application_conditions.application_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conditions for their applications" ON application_conditions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM loan_applications la
      JOIN partner_profiles pp ON la.partner_id = pp.id
      WHERE la.id = application_conditions.application_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update conditions for their applications" ON application_conditions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM loan_applications la
      JOIN partner_profiles pp ON la.partner_id = pp.id
      WHERE la.id = application_conditions.application_id
      AND pp.user_id = auth.uid()
    )
  );

-- Policy for condition_activities
CREATE POLICY "Users can view activities for their conditions" ON condition_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM application_conditions ac
      JOIN loan_applications la ON ac.application_id = la.id
      JOIN partner_profiles pp ON la.partner_id = pp.id
      WHERE ac.id = condition_activities.condition_id
      AND pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities for their conditions" ON condition_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM application_conditions ac
      JOIN loan_applications la ON ac.application_id = la.id
      JOIN partner_profiles pp ON la.partner_id = pp.id
      WHERE ac.id = condition_activities.condition_id
      AND pp.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_application_conditions_updated_at 
  BEFORE UPDATE ON application_conditions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONDITIONS SYSTEM COMPLETE
-- ===================================================== 