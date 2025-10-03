# Migration Guide: Single Account to Multi-Account Support

## Overview

This guide explains how the multi-account feature affects existing Keyshade users and how the system handles migration from single-account to multi-account mode.

## For Existing Users

### What Changes?

**Before Multi-Account Support:**
- User data stored directly in `localStorage['user']`
- Single JWT token in cookies
- One active session at a time

**After Multi-Account Support:**
- User data stored in `localStorage['keyshade_accounts']`
- Multiple profiles with individual tokens
- Can maintain multiple sessions

### Automatic Migration

The system automatically migrates existing users:

1. **First Login After Update:**
   - System detects old user data format
   - Creates a new profile from existing data
   - Migrates token to account manager
   - Sets as active profile

2. **Backward Compatibility:**
   - Old `user` atom still works
   - Account manager syncs with user atom
   - No action required from users

### Manual Migration (if needed)

If you experience issues:

```javascript
// Open browser console and run:
localStorage.removeItem('user')
localStorage.removeItem('keyshade_accounts')
// Then log in again
```

## For Developers

### Code Changes Required

#### Before (Single Account)
```typescript
import { userAtom } from '@/store'

// Get user
const user = useAtomValue(userAtom)

// Set user
setUser(userData)

// Logout
localStorage.clear()
Cookies.remove('token')
```

#### After (Multi-Account)
```typescript
import { userAtom } from '@/store'
import { accountManager } from '@/lib/account-manager'

// Get user (same as before)
const user = useAtomValue(userAtom)

// Set user with profile
setUser(userData)
if (userData.token) {
  accountManager.addProfile(userData, userData.token)
}

// Logout all accounts
accountManager.clearAllProfiles()

// Or logout single account
accountManager.removeProfile(profileId)
```

### Integration Checklist

When adding multi-account support to your code:

- [ ] Import account manager where needed
- [ ] Call `addProfile()` after successful authentication
- [ ] Use `switchProfile()` for account switching
- [ ] Call `clearAllProfiles()` on full logout
- [ ] Update UI to show multiple accounts
- [ ] Test with 2+ accounts

### API Changes

No breaking changes to existing APIs. New methods added:

```typescript
// Account Manager API
accountManager.addProfile(user, token): AccountProfile
accountManager.getActiveProfile(): AccountProfile | null
accountManager.getAllProfiles(): AccountProfile[]
accountManager.switchProfile(id): AccountProfile | null
accountManager.removeProfile(id): boolean
accountManager.clearAllProfiles(): void
accountManager.getProfile(id): AccountProfile | null
accountManager.getProfileByEmail(email): AccountProfile | null
accountManager.hasProfileByEmail(email): boolean
accountManager.updateProfile(id, updates): AccountProfile | null
accountManager.getProfileCount(): number
```

## Data Structure Changes

### Old Format (localStorage['user'])
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "profilePictureUrl": "https://...",
  "isOnboardingFinished": true,
  "defaultWorkspace": {
    "id": "workspace-123",
    "name": "My Workspace"
  }
}
```

### New Format (localStorage['keyshade_accounts'])
```json
{
  "version": "1.0.0",
  "activeProfileId": "user-123",
  "profiles": {
    "user-123": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "profilePictureUrl": "https://...",
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "isActive": true,
      "lastUsed": "2025-10-03T12:00:00.000Z",
      "workspaceId": "workspace-123"
    }
  }
}
```

## Testing Migration

### Test Scenario 1: Fresh Install
```
1. Install updated version
2. Login with new account
3. Verify account stored in account manager
4. Check localStorage['keyshade_accounts'] exists
```

### Test Scenario 2: Existing User
```
1. Have active session before update
2. Update to new version
3. Reload page
4. Verify session still active
5. Check account migrated to account manager
6. Add second account
7. Switch between accounts
```

### Test Scenario 3: Multiple Tabs
```
1. Open Keyshade in two tabs
2. Login different accounts in each
3. Switch accounts in one tab
4. Reload other tab
5. Verify each tab maintains its context
```

## Rollback Plan

If issues arise, rollback is straightforward:

1. **Revert Code:**
   ```bash
   git revert <commit-hash>
   ```

2. **Clear New Data:**
   ```javascript
   localStorage.removeItem('keyshade_accounts')
   ```

3. **Keep User Logged In:**
   - Old `user` atom data preserved
   - Token cookie still valid
   - No data loss

## Common Issues and Solutions

### Issue 1: Lost Session After Update
**Symptom:** Logged out after updating
**Solution:**
```javascript
// Check if account data exists
const accounts = localStorage.getItem('keyshade_accounts')
if (!accounts) {
  // Re-login required
  window.location.href = '/auth'
}
```

### Issue 2: Cannot Add Second Account
**Symptom:** Add account button not working
**Solution:**
- Clear browser cache
- Check console for errors
- Verify localStorage not full
- Try incognito mode

### Issue 3: Accounts Not Syncing Between Tabs
**Symptom:** Different active accounts in different tabs
**Solution:**
This is expected behavior. Each tab maintains independent state.
Use `storage` event to sync if needed:
```typescript
window.addEventListener('storage', (e) => {
  if (e.key === 'keyshade_accounts') {
    // Reload account data
  }
})
```

### Issue 4: Profile Data Incomplete
**Symptom:** Missing name or profile picture
**Solution:**
```typescript
// Update profile with missing data
accountManager.updateProfile(profileId, {
  name: 'Updated Name',
  profilePictureUrl: 'https://...'
})
```

## Security Considerations

### Token Storage
- Tokens stored in localStorage (consider security implications)
- Implement token rotation
- Set appropriate token expiry

### Cross-Site Scripting (XSS)
- Sanitize all user inputs
- Use Content Security Policy
- Validate tokens on backend

### Token Theft
- Use HTTP-only cookies for sensitive operations
- Implement device fingerprinting
- Add IP-based anomaly detection

## Performance Impact

### Storage Usage
- Single account: ~1KB
- 10 accounts: ~10KB
- Negligible impact on performance

### Memory Usage
- Profile data cached in memory
- Minimal overhead per profile
- No noticeable impact

### Network Impact
- No additional API calls
- Same authentication flow
- No performance degradation

## Support and Feedback

### Getting Help
- Documentation: `/docs/features/multi-account-support.md`
- GitHub Issues: Report bugs or feature requests
- Community: Discuss on Discord/Slack

### Providing Feedback
We want to hear from you!
- How easy was the transition?
- Any issues encountered?
- Feature suggestions?
- UX improvements?

## FAQ

**Q: Will I lose my data?**
A: No, all data is preserved during migration.

**Q: Do I need to re-authenticate?**
A: No, existing sessions remain valid.

**Q: Can I use both old and new versions?**
A: Yes, but account data won't sync between versions.

**Q: How many accounts can I add?**
A: No hard limit, but browser storage limits apply (~5-10MB).

**Q: Can I export my profiles?**
A: Not yet, but planned for future release.

**Q: Are accounts synced across devices?**
A: Not currently, each device stores profiles locally.

## Conclusion

The multi-account feature enhances Keyshade without disrupting existing users. The migration is automatic and backward-compatible. If you encounter any issues, please report them on GitHub.

Happy account switching! 🚀
