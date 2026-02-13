-- Migration to update vector dimensions from 768 to 384 for all-MiniLM-L6-v2
-- This will drop existing embeddings as they are incompatible with the new dimension size.

-- 1. Drop the dependent functions first
DROP FUNCTION IF EXISTS match_comments(vector(768), float, int);

-- 2. Drop and recreate the embedding column
ALTER TABLE public.comment_embeddings 
DROP COLUMN IF EXISTS embedding;

ALTER TABLE public.comment_embeddings 
ADD COLUMN embedding vector(384);

-- 3. Recreate the search function with 384 dimensions
CREATE OR REPLACE FUNCTION match_comments(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  comment_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.comment_id,
    c.content,
    1 - (ce.embedding <=> query_embedding) as similarity
  FROM comment_embeddings ce
  JOIN comments c ON ce.comment_id = c.id
  WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Recreate the index
CREATE INDEX IF NOT EXISTS comment_embeddings_embedding_idx_384 
ON comment_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
