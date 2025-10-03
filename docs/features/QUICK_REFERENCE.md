# Multi-Account Support - Quick Reference

## 🚀 Quick Start

### Add Account
```
Settings → Accounts → Add Another Account
```

### Switch Account
```
Navbar → Account Switcher → Select Account
```

### Remove Account
```
Settings → Accounts → Click 🗑️ → Confirm
```

## 💻 Developer API

### Import
```typescript
import { accountManager } from '@/lib/account-manager'
```

### Common Operations
```typescript
// Add profile
accountManager.addProfile(user, token)

// Get active
const active = accountManager.getActiveProfile()

// Switch
accountManager.switchProfile(id)

// List all
const profiles = accountManager.getAllProfiles()

// Remove
accountManager.removeProfile(id)

// Clear all
accountManager.clearAllProfiles()
```

## 📁 File Locations

### Core Files
- Service: `apps/platform/src/lib/account-manager.ts`
- Switcher: `apps/platform/src/components/shared/navbar/account-switcher.tsx`
- Settings: `apps/platform/src/components/userSettings/account-management/index.tsx`
- Hook: `apps/platform/src/hooks/use-account-sync.ts`

### Integration Points
- OTP Auth: `apps/platform/src/components/auth/otp/otp-input-form.tsx`
- OAuth: `apps/platform/src/app/auth/page.tsx`
- Menu: `apps/platform/src/components/shared/navbar/profile-menu.tsx`
- Layout: `apps/platform/src/app/(main)/(settings)/settings/layout.tsx`

### Documentation
- Main: `docs/features/multi-account-support.md`
- Implementation: `docs/features/IMPLEMENTATION.md`
- Migration: `docs/features/MIGRATION.md`
- Summary: `docs/features/FEATURE_SUMMARY.md`

## 🔧 Testing Commands

```bash
# Run tests
npm test account-manager.test.ts

# Watch mode
npm test -- --watch account-manager.test.ts

# Coverage
npm test -- --coverage
```

## 🎯 Key Concepts

### Profile Structure
```typescript
{
  id: string
  email: string
  name: string | null
  profilePictureUrl: string | null
  token: string
  isActive: boolean
  lastUsed: Date
  workspaceId?: string
}
```

### Storage Location
```
localStorage['keyshade_accounts']
```

### Storage Structure
```typescript
{
  version: "1.0.0"
  activeProfileId: string | null
  profiles: Record<string, AccountProfile>
}
```

## 📊 Integration Flow

### Login Flow
```
Login → Auth Success → Add Profile → Set Active → Redirect
```

### Switch Flow
```
Select → Update Active → Swap Token → Reload Context
```

### Logout Flow
```
Logout → Clear Profiles → Clear Cookies → Redirect to Auth
```

## 🔒 Security Notes

- Tokens stored in localStorage
- Cookies set with secure flags
- Per-profile session isolation
- Automatic cleanup on logout

## 🐛 Debugging

### Check Storage
```javascript
console.log(localStorage.getItem('keyshade_accounts'))
```

### Get Active Profile
```typescript
const active = accountManager.getActiveProfile()
console.log(active)
```

### List All Profiles
```typescript
const all = accountManager.getAllProfiles()
console.log(all)
```

### Clear Everything
```typescript
accountManager.clearAllProfiles()
```

## 📱 UI Components

### Navbar Switcher
- Location: Top right navbar
- Shows: Active account + dropdown
- Actions: Switch, Add, Remove

### Settings Page
- Location: Settings → Accounts tab
- Shows: All accounts with details
- Actions: Switch, Remove, Add

## ⚡ Performance

- Storage: ~1KB per profile
- Switch: <100ms
- Load: No impact on initial load
- Memory: Minimal overhead

## 🎨 Styling

- Uses Tailwind CSS
- Follows app design system
- Responsive design
- Dark mode compatible

## 📦 Dependencies

- jotai (state management)
- js-cookie (cookie handling)
- lucide-react (icons)
- React/Next.js

## 🔗 Related Features

- CLI profiles: `apps/cli/src/commands/profile/`
- Auth: `apps/platform/src/components/auth/`
- Settings: `apps/platform/src/app/(main)/(settings)/`

## 💡 Tips

1. Always reload after switching
2. Keep at least one account
3. Use email for identification
4. Check console for errors
5. Clear cache if issues

## ⚠️ Limitations

- Browser storage limits (5-10MB)
- No cross-device sync yet
- Manual reload required
- Local storage only

## 🎓 Learn More

- Full Docs: `docs/features/multi-account-support.md`
- Implementation: `docs/features/IMPLEMENTATION.md`
- Migration: `docs/features/MIGRATION.md`

## 📞 Get Help

- GitHub Issues
- Discord/Slack
- Email support