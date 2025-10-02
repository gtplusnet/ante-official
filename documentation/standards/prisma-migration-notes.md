# Prisma Migration Notes for Non-Interactive Environments

## ⚠️ CRITICAL WARNING
**NEVER use `prisma db push` in development** - it causes migration drift and can lead to data loss. This command bypasses the migration system entirely.

## Key Learning
`prisma migrate dev` CANNOT be run in non-interactive environments (like through automated scripts or Claude).

## Correct Approach for Schema Changes

### When You Need to Change the Database Schema:
1. **Edit** the `schema.prisma` file with your changes
2. **STOP** and notify the user immediately
3. **Ask the user** to run this command in their terminal:
   ```bash
   npx prisma migrate dev --name descriptive_name_here
   ```
4. **Wait** for user confirmation before continuing
5. **Never** attempt to apply schema changes yourself

### For Production Deployments:
```bash
# This only applies existing migrations, doesn't create new ones
npx prisma migrate deploy
```

## Important Rules:
1. **NEVER** use `prisma db push` - it's dangerous in team environments
2. **NEVER** try to create migration directories manually
3. **NEVER** try to bypass Prisma's migration system
4. **ALWAYS** require user to run migrations manually
5. **ALWAYS** wait for user confirmation after requesting migration

## Why This Matters:
- Migration files are required for deployment
- They track database history for the entire team
- `db push` can cause irreversible schema drift
- Manual migrations ensure proper version control

## What Claude Should Do:
1. Make changes to `schema.prisma`
2. Immediately inform user: "I've updated the schema. Please run: `npx prisma migrate dev --name [description]`"
3. Wait for user to confirm migration is complete
4. Continue with development after confirmation

## Remember:
If you encounter "non-interactive environment" error, this means the user MUST run the command manually. This is by design for safety.