-- Explicit first publication requested by the club; optional, never required by the app.
insert into public.announcements(slug,title,author_name,subtitle,description,content,status,starts_at,ends_at)
values (
 'fall-2026-general-meeting',
 'General meeting',
 'Dax Whitaker',
 E'TUE · SEP 15\n5:30 PM · HOS 210',
 'Food, new faces, and a semester of adventure. Everyone welcome.',
 E'Our semester meeting is finally scheduled!\n\n## Come meet the club\n\nTuesday, September 15, 2026, at 5:30 PM in HOS 210 at UNLV. All times are Pacific (Las Vegas).\n\nWe’ll have food, some icebreaking activities, and a presentation about club plans for this semester.\n\nMembers and non-members welcome! Whether you’re a familiar face or meeting us for the first time, come hear what’s ahead.\n\nSee you there!\n\n— Dax Whitaker',
 'published', '2026-09-08 00:00:00-07', '2026-09-16 00:00:00-07'
) on conflict (slug) do nothing;
