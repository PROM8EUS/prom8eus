-- Enable pgvector for embeddings
create extension if not exists vector;

-- Features table: normalized fields used for filtering/scoring
create table if not exists public.workflow_features (
  workflow_id text not null,
  source text not null,
  integrations_norm text[] not null default '{}',
  triggers_norm text[] not null default '{}',
  complexity_band text check (complexity_band in ('low','medium','high')),
  author_verified boolean not null default false,
  rating double precision,
  quality_prior double precision not null default 0,
  updated_at timestamptz not null default now(),
  constraint workflow_features_pkey primary key (source, workflow_id)
);

-- Embeddings table: vector similarity search
create table if not exists public.workflow_embeddings (
  workflow_id text not null,
  source text not null,
  embedding vector(3072) not null,
  updated_at timestamptz not null default now(),
  constraint workflow_embeddings_pkey primary key (source, workflow_id)
);

-- Optional cache table for recommendation responses
create table if not exists public.recommendation_cache (
  request_hash text primary key,
  profile jsonb not null,
  results jsonb not null,
  ttl timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists recommendation_cache_ttl_idx on public.recommendation_cache (ttl);


