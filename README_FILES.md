# File Guide - What to Run Where

## ✅ SQL Files (Run in Supabase SQL Editor)

These files contain SQL code and should be run in your Supabase project's SQL Editor:

1. **`database/schema.sql`** ✅ ALREADY RUN
   - Creates all tables, indexes, triggers, and RLS policies
   - Status: Successfully executed

2. **`database/verify-setup.sql`** (Optional)
   - Verification queries to check if everything was created correctly
   - Run this to verify your setup
   - Location: Supabase SQL Editor

## 📖 Documentation Files (Do NOT run in SQL Editor)

These are Markdown documentation files - just read them, don't run them:

- **`TEST_API.md`** - API testing guide (use curl/Postman/browser)
- **`BACKEND_PLAN.md`** - Architecture overview
- **`BACKEND_SETUP.md`** - Setup instructions
- **`BACKEND_STATUS.md`** - Implementation status
- **`NEXT_STEPS.md`** - Next steps guide
- **`SETUP_ENV.md`** - Environment setup guide

## 🧪 Testing API Endpoints

To test the API, use:
- **curl** (command line)
- **Postman** (GUI tool)
- **Browser** (for GET requests)
- **VS Code Thunder Client** (extension)

**DO NOT** paste API test commands into Supabase SQL Editor!

## 📝 Quick Reference

| File Type | Where to Use | Example |
|-----------|-------------|---------|
| `.sql` | Supabase SQL Editor | `database/schema.sql` |
| `.md` | Read in editor/IDE | `TEST_API.md` |
| `.ts` | Next.js API routes | `app/api/**/*.ts` |
| `.sh` | Terminal/Command line | `scripts/test-api.sh` |

## ✅ What You've Already Done

1. ✅ Created database schema (`database/schema.sql`)
2. ✅ Verified RLS policies (8 policies active)
3. ✅ Configured Supabase credentials

## 🚀 Next Steps

1. **Test API endpoints** - Use `TEST_API.md` as a guide (with curl/Postman, NOT SQL Editor)
2. **Start frontend integration** - Update components to use API
3. **Add missing endpoints** - Wallets, events, etc.
