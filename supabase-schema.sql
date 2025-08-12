-- Create campaigns table
create table if not exists public.campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  metrics jsonb not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index on name for faster searches
create index if not exists campaigns_name_idx on public.campaigns (name);

-- Create an index on created_at for sorting
create index if not exists campaigns_created_at_idx on public.campaigns (created_at desc);

-- Enable Row Level Security (RLS)
alter table public.campaigns enable row level security;

-- Create policy to allow all operations (since no auth yet)
create policy "Allow all operations on campaigns" on public.campaigns
  for all using (true);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger handle_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.handle_updated_at();