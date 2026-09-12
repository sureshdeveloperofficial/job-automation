-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
