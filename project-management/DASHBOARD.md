# Poker Trainer — Project Dashboard
## Quick Reference

---

### Links
- **Live App:** https://poker-trainer-ashy.vercel.app
- **Play Mode:** https://poker-trainer-ashy.vercel.app/play
- **Admin Dashboard:** https://poker-trainer-ashy.vercel.app/admin
- **GitHub:** https://github.com/chuckpoole-lab/poker-trainer
- **Supabase:** https://supabase.com/dashboard/project/zsougvzcbnravctjqhoa
- **NPPT:** https://npptpoker.com

### Project Files
- **Work Plan:** project-management/WORK-PLAN.md
- **Project Plan:** project-management/PROJECT-PLAN.md
- **Dev Log:** project-management/DEVLOG.md
- **UX Vision:** project-management/Poker-Trainer-UX-Vision-v2.html
- **Color Mockup:** project-management/wordle-poker-mockup.html
- **Strategy Doc:** Poker-Trainer-Product-Strategy-Roadmap.docx

### Key People
- Chris Thatcher (cthatcher1963@gmail.com) — Admin
- Chuck Poole (chuckpoole@gmail.com) — Admin

### Current Phase: UX Overhaul
- **Priority 1:** Implement warm visual redesign + 5-tab navigation with two-path home screens
- **Priority 2:** Fix assessment randomization + spot review + progress tab
- **Priority 3:** Simplify feedback form + wire settings
- **Priority 4:** App name + NPPT league outreach (after UX is solid)

### Waiting On
- Chuck review of UX vision doc (emailed April 5)
- Chris + Chuck: approve nav structure, color direction, player mode switching rules
- Session timeout fix: needs commit + push to deploy

### Daily Checklist
1. Check admin dashboard for new sessions + feedback
2. Play today's daily challenge
3. Pick one thing to advance from WORK-PLAN.md
4. Update work plan

### Stats (as of April 5, 2026)
- 36+ commits / 10,114+ lines added / 12 days
- 7 Supabase tables / 36+ RLS policies
- Session tracking live (guest + registered)
- 14,365 scenarios validated / 0 range gaps
- Dynamic scenario generator: hundreds of unique hands
- Two modes: Play (casual) + Train (grinder)
- Session timeout fix written (pending deploy)

### What Changed April 5
- Comprehensive UX vision: two-path experience (casual vs serious)
- Warm Wordle-inspired color palette approved direction
- 5-tab navigation replacing 8-tab layout
- Session timeout fix coded in auth-context.tsx
- All docs updated with correct URLs and new priorities
