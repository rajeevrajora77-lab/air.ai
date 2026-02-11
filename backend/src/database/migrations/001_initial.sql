-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  isactive BOOLEAN DEFAULT true,
  isverified BOOLEAN DEFAULT false,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_createdat ON users(createdat);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  isarchived BOOLEAN DEFAULT false,
  provider VARCHAR(50) DEFAULT 'openrouter',
  model VARCHAR(100) DEFAULT 'default',
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_userid ON conversations(userid);
CREATE INDEX IF NOT EXISTS idx_conversations_updatedat ON conversations(updatedat);
CREATE INDEX IF NOT EXISTS idx_conversations_userid_archived ON conversations(userid, isarchived);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversationid UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokensused INTEGER,
  model VARCHAR(100),
  provider VARCHAR(50),
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversationid ON messages(conversationid);
CREATE INDEX IF NOT EXISTS idx_messages_createdat ON messages(createdat);

-- Create function to update updatedat timestamp
CREATE OR REPLACE FUNCTION update_updatedat_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedat = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updatedat
CREATE TRIGGER update_users_updatedat
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updatedat_column();

CREATE TRIGGER update_conversations_updatedat
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updatedat_column();

-- Insert test user (password: Test@1234)
INSERT INTO users (email, password, firstname, lastname, role, isverified)
VALUES (
  'demo@air.ai',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyB2qvQrAPKi',
  'Demo',
  'User',
  'user',
  true
)
ON CONFLICT (email) DO NOTHING;