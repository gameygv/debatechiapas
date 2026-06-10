// process-social-queue: Now handled via main/index.ts router (queue-based)
// This file is kept for reference only — the actual logic is in main/index.ts
//
// Flow (updated 2026-06-10):
//   Phase 1: Verify 'sent' items via Make.com execution logs API
//            - status 1 (success) → mark as 'published'
//            - status 3 (error) → retry with backoff
//            - no execution after 15 min → retry
//   Phase 2: Dosification check (15 min between posts)
//   Phase 3: Pick next 'pending' item, send to Make.com webhook, mark as 'sent'
//
// Statuses: pending → processing → sent → published (or failed)
// Cron: every 5 min via system crontab on supabase-poesis
