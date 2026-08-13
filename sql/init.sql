-- NPCI Forum & AI Platform - Complete Database Schema & Seed Data Initialization
-- PostgreSQL 14+ Compatible

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    avatar TEXT,
    role VARCHAR(32) NOT NULL DEFAULT 'Member', -- 'Admin', 'Moderator', 'Member', 'PolicyAuditor'
    department VARCHAR(64) NOT NULL DEFAULT 'Core Banking',
    designation VARCHAR(64) NOT NULL DEFAULT 'Technical Specialist',
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Communities / Channels Table
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL DEFAULT 'Payments',
    member_count INT DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Forum Threads / Discussions
CREATE TABLE IF NOT EXISTS threads (
    id VARCHAR(64) PRIMARY KEY,
    community_id VARCHAR(64) REFERENCES communities(id) ON DELETE CASCADE,
    title VARCHAR(256) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    upvotes INT DEFAULT 0,
    views INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_solved BOOLEAN DEFAULT FALSE,
    tags TEXT[], -- Array of tags e.g. ARRAY['UPI', 'API', 'Compliance']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Discussion Comments / Replies
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(64) PRIMARY KEY,
    thread_id VARCHAR(64) REFERENCES threads(id) ON DELETE CASCADE,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    parent_id VARCHAR(64) REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    is_accepted_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Direct & Group Messages
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    chat_id VARCHAR(64) NOT NULL,
    sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Compliance & Policy Documents
CREATE TABLE IF NOT EXISTS policies (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    category VARCHAR(64) NOT NULL,
    version VARCHAR(16) NOT NULL DEFAULT 'v1.0',
    file_url TEXT,
    uploaded_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Audit & Telemetry Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(128) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. AI Observability Traces
CREATE TABLE IF NOT EXISTS ai_traces (
    id VARCHAR(64) PRIMARY KEY,
    agent_name VARCHAR(64) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    latency_sec NUMERIC(8,4) NOT NULL,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    tool_calls JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. AI Cost Tracker Logs
CREATE TABLE IF NOT EXISTS cost_logs (
    id VARCHAR(64) PRIMARY KEY,
    model_name VARCHAR(64) NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_threads_community ON threads(community_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_traces_user ON ai_traces(user_id);

-- SEED INITIAL DATA FOR NPCI FORUM
INSERT INTO users (id, name, email, avatar, role, department, designation) VALUES
('u1', 'Pravin Kumar', 'pravinau26@gmail.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Admin', 'UPI Product Core', 'Lead DevSecOps Architect'),
('u2', 'Ananya Sharma', 'ananya.s@npci.org.in', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'PolicyAuditor', 'Regulatory & Compliance', 'Senior Policy Analyst'),
('u3', 'Rajesh Patel', 'rajesh.p@sbi.co.in', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Member', 'Bank Integration - SBI', 'Chief Technical Officer'),
('u4', 'Priya Nair', 'priya.nair@hdfcbank.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Moderator', 'Switching Infrastructure', 'VP Engineering')
ON CONFLICT (id) DO NOTHING;

INSERT INTO communities (id, name, slug, description, category, member_count, is_private) VALUES
('c1', 'UPI 2.0 Compliance', 'upi-2-compliance', 'Discussions on mandated transaction limits, mandate revoking APIs, and auto-pay specifications.', 'UPI', 1420, false),
('c2', 'RuPay Technical Specs', 'rupay-tech-specs', 'EMV Contactless, offline card balance synchronization, and international acceptance protocols.', 'RuPay', 890, false),
('c3', 'Product Design & Architecture', 'product-design', 'High-level system design, multi-datacenter active-active latency tuning, and resilience.', 'Architecture', 650, false),
('c4', 'NPCI Policy & Circulars', 'npci-policy', 'Official NPCI circular updates, MDR regulations, interchange fees, and compliance deadlines.', 'Compliance', 2300, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO threads (id, community_id, title, content, author_id, upvotes, views, is_pinned, is_solved, tags) VALUES
('t1', 'c1', 'Clarification on UPI 2.0 Rs 5 Lakh High-Value Mandate API Specs', 'Hi team, we are implementing the new Rs 5 Lakh ceiling limit for educational & healthcare merchants. Does the pre-authorization lock payload require additional HMAC headers from the issuer bank?', 'u1', 42, 1280, true, true, ARRAY['UPI', 'Mandates', 'Compliance']),
('t2', 'c2', 'RuPay Contactless Offline Transit Processing Latency < 100ms', 'Our gate validator at metro stations is measuring a 140ms roundtrip delay during offline balance deduction. Are there optimized APDU commands for faster crypto verification?', 'u3', 28, 740, false, false, ARRAY['RuPay', 'NCMC', 'Offline']),
('t3', 'c4', 'NPCI Circular #142/2026: Mandatory Migration to OAuth 2.0 mTLS', 'All member banks and TPAP providers must migrate their API endpoints to mutual TLS (mTLS) with X.509 certificates by Q4 2026. Please share your migration checklists here.', 'u2', 89, 3100, true, false, ARRAY['Circular', 'Security', 'mTLS'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO comments (id, thread_id, author_id, content, upvotes, is_accepted_answer) VALUES
('cm1', 't1', 'u2', 'Yes, according to Section 4.2 of the NPCI UPI 2.0 Security Specification, any mandate value exceeding Rs 100,000 must include an encrypted Issuer Security Token (IST) generated using SHA256-HMAC.', 34, true),
('cm2', 't1', 'u3', 'Thank you! We have verified this with the SBI core gateway and the authorization succeeds smoothly now.', 12, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO policies (id, title, category, version, uploaded_by, status) VALUES
('p1', 'NPCI Unified Payments Interface (UPI) Procedural Guidelines v3.4', 'UPI', 'v3.4', 'u2', 'ACTIVE'),
('p2', 'RuPay Contactless (NCMC) Interoperable Transit Operating Rules 2026', 'RuPay', 'v2.1', 'u1', 'ACTIVE'),
('p3', 'Cybersecurity Mandate for TPAP Ecosystem Partners & PSP Banks', 'Security', 'v1.0', 'u4', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, user_id, action, resource, details, ip_address) VALUES
('a1', 'u1', 'DEPLOY_TERRAFORM', 'AWS us-east-1 VPC & EC2', '{"status": "SUCCESS", "eip": "static_assigned"}', '10.0.1.100'),
('a2', 'u2', 'PUBLISH_POLICY', 'NPCI Circular #142/2026', '{"version": "v1.0", "target_audience": "All Member Banks"}', '10.0.1.102')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_traces (id, agent_name, prompt, response, latency_sec, user_id) VALUES
('tr1', 'PolicyRAGAgent', 'What is the maximum UPI mandate limit for education?', '[NPCI AI Agent]: The maximum limit is Rs 5,000,000 (5 Lakhs) per transaction for verified educational and healthcare merchants as per NPCI 2026 Circular.', 0.3200, 'u1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cost_logs (id, model_name, input_tokens, output_tokens, cost_usd, user_id) VALUES
('cl1', 'gemini-2.5-flash', 120, 85, 0.000069, 'u1')
ON CONFLICT (id) DO NOTHING;
