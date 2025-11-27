# Qoder Instruction File — Update Plan for Client Requests

## Overview
Client wants additional functionality based on the reference site [Learning Dojo Templates](https://courses.learningdojo.ninja/c/templates/). The goal is to expand the existing project [Tamer Educational Activities](https://tamer-educational-activities.vercel.app/) to include public templates, interactive video features, user dashboards, and SCORM export. Follow the instructions below to modify both frontend and backend.

---

## 1. Templates Gallery
- **Create route:** `/templates`
- **Function:** Public page listing all templates.
- **Fields to display:** Title, Thumbnail, Short Description, Category, Buttons (Preview / Use Template / Download SCORM)
- **Data source:** `templates` table (new)
- **Features:** Pagination, search bar, and filter by category.

## 2. Template Detail Page
- **Create route:** `/templates/[slug]`
- **Show:** Title, Description, Duration, Demo iframe (optional), Features, and Assets.
- **Buttons:** Use this Template → Clone to user dashboard, Download SCORM (if available).
- **Data source:** `templates`, `template_assets`, `scorm_packages`

## 3. Add Tables (Supabase / Postgres)
```sql
-- templates
create table templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,
  long_description text,
  template_type text not null,
  preview_thumb_url text,
  preview_hero_url text,
  demo_url text,
  is_listed boolean default true,
  is_scorm_downloadable boolean default false,
  settings_json jsonb default '{}'::jsonb,
  content_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- template_assets
create table template_assets (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete cascade,
  asset_type text,
  label text,
  asset_url text,
  order_index int default 0
);

-- scorm_packages
create table scorm_packages (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete cascade,
  game_id uuid references games(id) on delete cascade,
  version int default 1,
  zip_url text,
  standard text default 'SCORM_1_2',
  created_at timestamptz default now()
);
```

## 4. API Routes (Next.js)
```
/api/templates [GET] - list all templates
/api/templates/[slug] [GET] - get template details
/api/templates/[id]/use [POST] - clone template to user's dashboard
/api/games/[id]/scorm [GET|POST] - download or build SCORM package
```

## 5. Editor Update
- Add **Interactive Video Template** option.
- Use **YouTube/Vimeo** URLs.
- Allow adding timeline questions with 2–3 choices.
- Pause video for questions, display correct/incorrect feedback.
- Calculate score and completion percentage.

## 6. Game Area Enhancements
- Add buttons: Share, Embed, Fullscreen, Sound On/Off.
- Add background music toggle.
- Add Timer (countdown or stopwatch) and Score display.
- Allow switching visual style/theme (CSS-based).

## 7. Dashboard Update
- Add fields: Title, Template Type, Last Edited, Plays, Avg Score.
- Actions: Edit, Preview, Share, Embed, Download SCORM.
- Save by User ID and Game ID.

## 8. SCORM Export
- Add server function to generate SCORM 1.2 or 2004 package.
- Include imsmanifest.xml, index.html, JS player, and zipped output.
- Save generated file info in `scorm_packages` table.

## 9. Frontend Components
- **TemplatesGallery**
- **TemplateDetail**
- **VideoPlayerWithQuestions**
- **DashboardList**
- **SCORMDownloadButton**

## 10. Styling
- Use Tailwind CSS variables for themes.
- Create at least 3 default styles: Minimal, Chalkboard, Neon.

## 11. Deployment
- Test all new routes locally.
- Sync Supabase migrations.
- Push to Vercel staging before production deploy.

---

**End of Qoder instruction file.**
