-- Migration 002: Add claims table and enhance policy_files
-- Claims tracking for insurance policies

CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY,
    policy_id INTEGER NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    claim_number TEXT NOT NULL,
    date TEXT,
    amount REAL,
    status TEXT CHECK (status IN ('open','pending','closed')) DEFAULT 'open',
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_date ON claims(date);

-- Enhance policy_files table for versioning and soft delete
ALTER TABLE policy_files ADD COLUMN is_deleted INTEGER DEFAULT 0;
ALTER TABLE policy_files ADD COLUMN version INTEGER DEFAULT 1;  
ALTER TABLE policy_files ADD COLUMN replaces_file_id INTEGER NULL REFERENCES policy_files(id);

-- Create index for active files
CREATE INDEX IF NOT EXISTS idx_policy_files_active ON policy_files(is_deleted, policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_files_version ON policy_files(replaces_file_id, version);

-- Optional carrier normalization table
CREATE TABLE IF NOT EXISTS carriers_map (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Insert common carrier normalizations
INSERT OR IGNORE INTO carriers_map (key, value) VALUES
('state farm', 'State Farm'),
('statefarm', 'State Farm'),
('allstate', 'Allstate'),
('all state', 'Allstate'),
('travelers', 'Travelers'),
('liberty mutual', 'Liberty Mutual'),
('libertymutual', 'Liberty Mutual'),
('farmers', 'Farmers'),
('csaa', 'CSAA Insurance Group'),
('aaa', 'AAA Insurance'),
('nationwide', 'Nationwide'),
('progressive', 'Progressive'),
('geico', 'GEICO'),
('usaa', 'USAA');
