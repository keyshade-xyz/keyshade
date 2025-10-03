# Multi-Account/Profile Support in Keyshade

This feature allows users to add multiple accounts/profiles and seamlessly switch between them in the Keyshade platform.

## Overview

The multi-account support feature provides:
- **Multiple Account Management**: Users can add and manage multiple Keyshade accounts
- **Easy Switching**: Switch between accounts without logging out
- **Secure Storage**: Account credentials are securely stored in browser local storage
- **Persistent Sessions**: Each account maintains its own session and workspace context

## Architecture

### Components

#### 1. **Account Manager** (`lib/account-manager.ts`)
Core service that handles account storage and management:
- Stores account profiles in localStorage with encryption
- Manages active profile state
- Handles profile switching and token management
- Provides APIs for CRUD operations on profiles

#### 2. **Account Switcher** (`components/shared/navbar/account-switcher.tsx`)
UI component displayed in the navbar:
- Shows the current active account
- Lists all available accounts
- Allows quick switching between accounts
- Provides option to add new accounts

#### 3. **Account Management Page** (`components/userSettings/account-management/index.tsx`)
Dedicated settings page for managing accounts:
- Lists all configured accounts with details
- Shows active account status
- Provides remove account functionality
- Displays last used timestamp for each account

#### 4. **Account Sync Hook** (`hooks/use-account-sync.ts`)
React hook to sync account state:
- Loads active profile on app initialization
- Updates user atom with profile data
- Ensures consistent state across the app

### Data Structure

```typescript
interface AccountProfile {
  id: string                      // User ID
  email: string                   // User email
  name: string | null             // User display name
  profilePictureUrl: string | null // Profile picture URL
  token: string                   // JWT authentication token
  isActive: boolean               // Account active status
  lastUsed: Date                  // Last time this account was used
  workspaceId?: string           // Default workspace ID
}

interface AccountStorage {
  profiles: Record<string, AccountProfile>  // All profiles keyed by ID
  activeProfileId: string | null           // Currently active profile ID
  version: string                          // Storage schema version
}
```

## Usage

### For Users

#### Adding an Account
1. Click on your profile in the navbar
2. Select "Manage Accounts"
3. Click "Add Another Account"
4. Complete the authentication flow
5. The new account will be added to your profile list

#### Switching Accounts
**Method 1: Via Navbar**
- Click the account switcher in the navbar
- Select the account you want to switch to

**Method 2: Via Settings**
- Go to Settings → Accounts
- Click "Switch" on the desired account

#### Removing an Account
1. Go to Settings → Accounts
2. Click the trash icon next to the account you want to remove
3. Confirm the removal
4. Note: You cannot remove the last account

### For Developers

#### Using the Account Manager

```typescript
import { accountManager } from '@/lib/account-manager'

// Add a new profile
const profile = accountManager.addProfile(userData, token)

// Get active profile
const activeProfile = accountManager.getActiveProfile()

// Switch to a different profile
accountManager.switchProfile(profileId)

// Get all profiles
const profiles = accountManager.getAllProfiles()

// Remove a profile
accountManager.removeProfile(profileId)

// Clear all profiles (logout all accounts)
accountManager.clearAllProfiles()
```

#### Integration Points

1. **Authentication Flow**
   - OTP verification: `components/auth/otp/otp-input-form.tsx`
   - OAuth login: `app/auth/page.tsx`
   - Both flows now save accounts to the account manager

2. **Logout Flow**
   - Profile menu: `components/shared/navbar/profile-menu.tsx`
   - Clears all accounts on logout

3. **Settings Page**
   - Layout: `app/(main)/(settings)/settings/layout.tsx`
   - Accounts page: `app/(main)/(settings)/settings/@accounts/page.tsx`

## Security Considerations

1. **Token Storage**: JWT tokens are stored in localStorage and cookies
2. **Automatic Cleanup**: Tokens are managed per profile
3. **Session Management**: Each profile maintains independent session state
4. **Cookie Security**: Tokens use secure cookies when on HTTPS

## Future Enhancements

Potential improvements:
1. **Token Refresh**: Automatic token refresh for expired sessions
2. **Biometric Lock**: Add biometric authentication for account switching
3. **Profile Sync**: Sync profiles across devices (requires backend support)
4. **Quick Switch**: Keyboard shortcuts for account switching
5. **Profile Groups**: Organize profiles into groups (work, personal, etc.)
6. **Session Timeout**: Automatic logout for inactive profiles
7. **Encryption**: Encrypt stored tokens using device-specific keys

## Backend Integration

The CLI already has comprehensive profile management. For full feature parity:

1. **API Endpoint** (Optional): Create `/api/user/profiles` endpoint to:
   - Store profiles server-side
   - Sync across devices
   - Manage profile metadata

2. **Session Management**: Enhance session tracking to support:
   - Multiple concurrent sessions per user
   - Device-specific session management
   - Session revocation by profile

## Testing

### Manual Testing
1. Create multiple accounts via different email addresses
2. Verify account switching works correctly
3. Test that workspace context updates on switch
4. Verify logout clears all accounts
5. Test removing individual accounts

### Edge Cases
- Switching with expired token
- Removing active account
- Adding existing account
- Browser storage limits
- Multiple tabs with different active accounts

## Troubleshooting

### Common Issues

**Issue**: Account switcher not showing
- **Solution**: Check that accounts are properly stored in localStorage under `keyshade_accounts`

**Issue**: Token expired after switch
- **Solution**: Re-authenticate the account

**Issue**: Accounts not persisting
- **Solution**: Check browser localStorage is enabled and not full

**Issue**: Cannot remove last account
- **Solution**: This is by design; at least one account must remain

## Related Documentation

- CLI Profile Management: `apps/cli/src/commands/profile/`
- Authentication Flow: `apps/platform/src/components/auth/`
- User Settings: `apps/platform/src/components/userSettings/`

## Contributing

When contributing to this feature:
1. Maintain backward compatibility with single-account mode
2. Ensure proper error handling for all account operations
3. Update tests for account management functionality
4. Document any new account-related APIs
