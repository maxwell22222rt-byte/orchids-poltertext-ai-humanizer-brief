-- Automated Checker Payment System Database Schema
-- All phone numbers are stored in 254 format (2547XXXXXXXX)

-- Checkers table - Content validators who get automated payments
CREATE TABLE IF NOT EXISTS checkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(13) NOT NULL CHECK (phone_number ~ '^254[712]\d{8}$'), -- Enforces 254 format
  rate_per_task DECIMAL(10, 2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,
  total_tasks_completed INTEGER DEFAULT 0,
  total_earned DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(phone_number)
);

-- Create index on phone number for fast lookups
CREATE INDEX IF NOT EXISTS idx_checkers_phone ON checkers(phone_number);
CREATE INDEX IF NOT EXISTS idx_checkers_active ON checkers(is_active);

-- Checker payments table - Tracks all automated payments
CREATE TABLE IF NOT EXISTS checker_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checker_id UUID NOT NULL REFERENCES checkers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  phone_number VARCHAR(13) NOT NULL, -- Stored in 254 format
  reason VARCHAR(500) NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed
  transaction_id VARCHAR(255),
  initiated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for payment tracking
CREATE INDEX IF NOT EXISTS idx_checker_payments_checker_id ON checker_payments(checker_id);
CREATE INDEX IF NOT EXISTS idx_checker_payments_status ON checker_payments(status);
CREATE INDEX IF NOT EXISTS idx_checker_payments_initiated ON checker_payments(initiated_at DESC);

-- Checker tasks table - Track individual tasks completed
CREATE TABLE IF NOT EXISTS checker_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checker_id UUID NOT NULL REFERENCES checkers(id) ON DELETE CASCADE,
  task_type VARCHAR(100) NOT NULL, -- e.g., 'content_validation', 'quality_check'
  content_id UUID,
  status VARCHAR(50) DEFAULT 'completed', -- completed, reviewed, rejected
  payment_amount DECIMAL(10, 2) NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  paid BOOLEAN DEFAULT false,
  payment_id UUID REFERENCES checker_payments(id),
  notes TEXT
);

-- Create indexes for task tracking
CREATE INDEX IF NOT EXISTS idx_checker_tasks_checker_id ON checker_tasks(checker_id);
CREATE INDEX IF NOT EXISTS idx_checker_tasks_paid ON checker_tasks(paid);
CREATE INDEX IF NOT EXISTS idx_checker_tasks_completed ON checker_tasks(completed_at DESC);

-- Function to update checker statistics when payment is completed
CREATE OR REPLACE FUNCTION update_checker_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    UPDATE checkers
    SET 
      total_tasks_completed = total_tasks_completed + NEW.tasks_completed,
      total_earned = total_earned + NEW.amount
    WHERE id = NEW.checker_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update checker stats on payment success
CREATE TRIGGER trigger_update_checker_stats
AFTER UPDATE ON checker_payments
FOR EACH ROW
EXECUTE FUNCTION update_checker_stats();

-- Function to validate phone number format on insert/update
CREATE OR REPLACE FUNCTION validate_phone_format()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone_number !~ '^254[712]\d{8}$' THEN
    RAISE EXCEPTION 'Phone number must be in format 254XXXXXXXXX (Kenyan format)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce phone format validation
CREATE TRIGGER trigger_validate_phone
BEFORE INSERT OR UPDATE ON checkers
FOR EACH ROW
EXECUTE FUNCTION validate_phone_format();

-- View to get checker payment summary
CREATE OR REPLACE VIEW checker_payment_summary AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.phone_number,
  c.is_active,
  c.total_tasks_completed,
  c.total_earned,
  COUNT(cp.id) as total_payments,
  SUM(CASE WHEN cp.status = 'success' THEN cp.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN cp.status = 'pending' THEN cp.amount ELSE 0 END) as pending_amount,
  MAX(cp.initiated_at) as last_payment_date
FROM checkers c
LEFT JOIN checker_payments cp ON c.id = cp.checker_id
GROUP BY c.id, c.name, c.email, c.phone_number, c.is_active, c.total_tasks_completed, c.total_earned;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO checkers (name, email, phone_number, rate_per_task) VALUES
-- ('John Kamau', 'john@example.com', '254712345678', 15.00),
-- ('Mary Wanjiku', 'mary@example.com', '254723456789', 20.00),
-- ('Peter Odhiambo', 'peter@example.com', '254734567890', 18.00);

-- Grant permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE ON checkers TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON checker_payments TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON checker_tasks TO authenticated;

-- Comments for documentation
COMMENT ON TABLE checkers IS 'Content checkers/validators who receive automated payments';
COMMENT ON TABLE checker_payments IS 'Record of all automated payments to checkers via MPesa';
COMMENT ON TABLE checker_tasks IS 'Individual tasks completed by checkers';
COMMENT ON COLUMN checkers.phone_number IS 'Phone number in 254 format for MPesa payments (2547XXXXXXXX)';
COMMENT ON COLUMN checker_payments.phone_number IS 'Phone number used for payment in 254 format';
