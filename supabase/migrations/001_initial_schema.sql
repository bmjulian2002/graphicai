-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth maneja esto automáticamente)
-- Solo necesitamos extender con campos personalizados si es necesario

-- Flows table
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flow data table
CREATE TABLE flow_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID UNIQUE NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  nodes_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_flows_user_id ON flows(user_id);
CREATE INDEX idx_flows_updated_at ON flows(updated_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_data_updated_at
  BEFORE UPDATE ON flow_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flows
CREATE POLICY "Users can view their own flows"
  ON flows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flows"
  ON flows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows"
  ON flows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flows"
  ON flows FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for flow_data
CREATE POLICY "Users can view their own flow data"
  ON flow_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = flow_data.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own flow data"
  ON flow_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = flow_data.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own flow data"
  ON flow_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = flow_data.flow_id
      AND flows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own flow data"
  ON flow_data FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM flows
      WHERE flows.id = flow_data.flow_id
      AND flows.user_id = auth.uid()
    )
  );
