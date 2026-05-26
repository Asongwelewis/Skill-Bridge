-- ============================================================
-- SkillBridge — Supabase Schema + RLS
-- Course: SEN3244 Software Architecture
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
create type skill_role      as enum ('teach', 'learn', 'both');
create type match_status    as enum ('pending', 'accepted', 'declined', 'completed');
create type session_status  as enum ('scheduled', 'live', 'completed', 'cancelled');
create type quiz_status     as enum ('draft', 'published', 'archived');
create type criteria_type   as enum ('sessions_completed', 'quiz_passed', 'xp_threshold', 'skills_taught', 'skills_learned');

-- ── profiles ─────────────────────────────────────────────────
-- Extends Supabase auth.users (1-to-1)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  full_name     text,
  avatar_url    text,
  bio           text,
  timezone      text default 'UTC',
  xp_points     integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── skills ───────────────────────────────────────────────────
-- Master skill catalog (admin-managed or user-suggested)
create table skills (
  id            uuid primary key default uuid_generate_v4(),
  name          text unique not null,
  category      text not null,
  description   text,
  created_at    timestamptz not null default now()
);

-- ── user_skills ──────────────────────────────────────────────
-- A user's relationship to a skill: teach, learn, or both
create table user_skills (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references profiles(id) on delete cascade,
  skill_id          uuid not null references skills(id) on delete cascade,
  role              skill_role not null,
  proficiency_level integer not null default 1 check (proficiency_level between 1 and 5),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (user_id, skill_id, role)
);

-- ── matches ──────────────────────────────────────────────────
-- Auto-generated pairing: one user teaches, another learns, same skill
create table matches (
  id            uuid primary key default uuid_generate_v4(),
  learner_id    uuid not null references profiles(id) on delete cascade,
  teacher_id    uuid not null references profiles(id) on delete cascade,
  skill_id      uuid not null references skills(id) on delete cascade,
  status        match_status not null default 'pending',
  match_score   integer not null default 0,     -- algorithm confidence 0-100
  matched_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint no_self_match check (learner_id <> teacher_id)
);

-- ── sessions ─────────────────────────────────────────────────
-- A live WebRTC video session that stems from a match
create table sessions (
  id               uuid primary key default uuid_generate_v4(),
  match_id         uuid not null references matches(id) on delete cascade,
  host_id          uuid not null references profiles(id) on delete cascade,
  status           session_status not null default 'scheduled',
  webrtc_room_id   text unique,                 -- generated room token
  scheduled_at     timestamptz,
  started_at       timestamptz,
  ended_at         timestamptz,
  duration_seconds integer,
  created_at       timestamptz not null default now()
);

-- ── quizzes ──────────────────────────────────────────────────
-- AI-generated quiz created after a session ends
create table quizzes (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references sessions(id) on delete cascade,
  title         text not null,
  status        quiz_status not null default 'draft',
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  created_at    timestamptz not null default now()
);

-- ── quiz_questions ───────────────────────────────────────────
create table quiz_questions (
  id              uuid primary key default uuid_generate_v4(),
  quiz_id         uuid not null references quizzes(id) on delete cascade,
  question_text   text not null,
  options         jsonb not null,   -- ["option A", "option B", "option C", "option D"]
  correct_answer  text not null,
  order_index     integer not null default 0
);

-- ── quiz_attempts ────────────────────────────────────────────
create table quiz_attempts (
  id             uuid primary key default uuid_generate_v4(),
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  score          integer not null default 0 check (score between 0 and 100),
  passed         boolean not null default false,
  completed_at   timestamptz not null default now(),
  unique (quiz_id, user_id)   -- one attempt per user per quiz
);

-- ── quiz_responses ───────────────────────────────────────────
create table quiz_responses (
  id             uuid primary key default uuid_generate_v4(),
  attempt_id     uuid not null references quiz_attempts(id) on delete cascade,
  question_id    uuid not null references quiz_questions(id) on delete cascade,
  answer_given   text not null,
  is_correct     boolean not null default false
);

-- ── badges ───────────────────────────────────────────────────
-- Flexible badge definitions (admin-managed)
create table badges (
  id              uuid primary key default uuid_generate_v4(),
  name            text unique not null,
  description     text not null,
  icon_url        text,
  criteria_type   criteria_type not null,
  criteria_value  jsonb not null,   -- e.g. {"threshold": 5} or {"skill_id": "..."}
  created_at      timestamptz not null default now()
);

-- ── user_badges ──────────────────────────────────────────────
create table user_badges (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  badge_id        uuid not null references badges(id) on delete cascade,
  awarded_at      timestamptz not null default now(),
  awarded_reason  text,
  unique (user_id, badge_id)   -- a badge is only awarded once per user
);

-- ============================================================
-- Indexes
-- ============================================================
create index on user_skills  (user_id);
create index on user_skills  (skill_id);
create index on matches      (learner_id);
create index on matches      (teacher_id);
create index on matches      (skill_id);
create index on matches      (status);
create index on sessions     (match_id);
create index on sessions     (status);
create index on quizzes      (session_id);
create index on quiz_attempts (user_id);
create index on quiz_attempts (quiz_id);
create index on user_badges  (user_id);

-- ============================================================
-- Auto-update updated_at
-- ============================================================
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on profiles
  for each row execute procedure handle_updated_at();

create trigger on_matches_updated
  before update on matches
  for each row execute procedure handle_updated_at();

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table profiles       enable row level security;
alter table skills         enable row level security;
alter table user_skills    enable row level security;
alter table matches        enable row level security;
alter table sessions       enable row level security;
alter table quizzes        enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts  enable row level security;
alter table quiz_responses enable row level security;
alter table badges         enable row level security;
alter table user_badges    enable row level security;

-- ── profiles ─────────────────────────────────────────────────
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ── skills ───────────────────────────────────────────────────
create policy "Skills are viewable by everyone"
  on skills for select using (true);

create policy "Only authenticated users can suggest skills"
  on skills for insert with check (auth.role() = 'authenticated');

-- ── user_skills ──────────────────────────────────────────────
create policy "User skills are viewable by everyone"
  on user_skills for select using (true);

create policy "Users manage their own skills"
  on user_skills for all using (auth.uid() = user_id);

-- ── matches ──────────────────────────────────────────────────
create policy "Users can see their own matches"
  on matches for select
  using (auth.uid() = learner_id or auth.uid() = teacher_id);

create policy "System can insert matches"
  on matches for insert with check (auth.role() = 'authenticated');

create policy "Participants can update match status"
  on matches for update
  using (auth.uid() = learner_id or auth.uid() = teacher_id);

-- ── sessions ─────────────────────────────────────────────────
create policy "Session participants can view sessions"
  on sessions for select
  using (
    auth.uid() = host_id or
    auth.uid() in (
      select learner_id from matches where id = match_id
      union
      select teacher_id from matches where id = match_id
    )
  );

create policy "Host can insert and update sessions"
  on sessions for all using (auth.uid() = host_id);

-- ── quizzes ──────────────────────────────────────────────────
create policy "Session participants can view quizzes"
  on quizzes for select
  using (
    exists (
      select 1 from sessions s
      join matches m on m.id = s.match_id
      where s.id = session_id
        and (m.learner_id = auth.uid() or m.teacher_id = auth.uid())
    )
  );

-- ── quiz_questions ───────────────────────────────────────────
create policy "Participants can view quiz questions"
  on quiz_questions for select
  using (
    exists (
      select 1 from quizzes q
      join sessions s on s.id = q.session_id
      join matches m on m.id = s.match_id
      where q.id = quiz_id
        and (m.learner_id = auth.uid() or m.teacher_id = auth.uid())
    )
  );

-- ── quiz_attempts ────────────────────────────────────────────
create policy "Users can view their own attempts"
  on quiz_attempts for select using (auth.uid() = user_id);

create policy "Users can insert their own attempts"
  on quiz_attempts for insert with check (auth.uid() = user_id);

-- ── quiz_responses ───────────────────────────────────────────
create policy "Users can view their own responses"
  on quiz_responses for select
  using (
    exists (
      select 1 from quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

create policy "Users can insert their own responses"
  on quiz_responses for insert
  with check (
    exists (
      select 1 from quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

-- ── badges ───────────────────────────────────────────────────
create policy "Badges are viewable by everyone"
  on badges for select using (true);

-- ── user_badges ──────────────────────────────────────────────
create policy "User badges are viewable by everyone"
  on user_badges for select using (true);

-- ============================================================
-- Seed: starter badges
-- ============================================================
insert into badges (name, description, icon_url, criteria_type, criteria_value) values
  ('First Session',    'Completed your first learning session',       null, 'sessions_completed', '{"threshold": 1}'),
  ('Quiz Master',      'Passed 5 quizzes with full marks',            null, 'quiz_passed',        '{"threshold": 5}'),
  ('Knowledge Sharer', 'Taught a skill in 3 sessions',                null, 'skills_taught',      '{"threshold": 3}'),
  ('Fast Learner',     'Learned 3 different skills',                  null, 'skills_learned',     '{"threshold": 3}'),
  ('XP Legend',        'Reached 1000 XP points',                     null, 'xp_threshold',       '{"threshold": 1000}');
