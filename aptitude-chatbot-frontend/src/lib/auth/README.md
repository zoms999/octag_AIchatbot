# Authentication System

This directory contains a comprehensive authentication system for the Next.js frontend application. The system provides JWT-based authentication with automatic token refresh, role-based access control, and secure token management.

## Features

- **JWT Token Management**: Secure storage and automatic refresh of access and refresh tokens
- **Role-Based Access Control**: Support for different user types (personal, organization admin, organization member)
- **Automatic Token Refresh**: Background token refresh to maintain user sessions
- **Cross-Tab Synchronization**: Auth state sync across browser tabs
- **Protected Routes**: Route guards for authentication and authorization
- **Secure Storage**: Access tokens in session storage, refresh tokens in local storage
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **TypeScript Support**: Full type safety throughout the auth system

## Architecture

### Core Components

1. **AuthStore (Zustand)**: Central state management for authentication
2. **TokenManager**: Secure token storage and retrieval
3. **AuthService**: API communication for auth operations
4. **AuthMiddleware**: Request interceptor for automatic token management
5. **AuthGuard**: Route protection and middleware for Next.js
6. **AuthUtils**: Utility functions for token validation and user management

### File Structure

```
src/lib/auth/
├── authConfig.ts          # Configuration constants
├── authService.ts         # API service for auth operations
├── authMiddleware.ts      # Request middleware for token management
├── authGuard.ts          # Next.js middleware for route protection
├── authUtils.ts          # Utility functions
├── tokenRefresh.ts       # Token refresh logic
├── AuthContext.tsx       # React context provider
└── index.ts              # Exports
```

## Usage

### Basic Setup

1. **Wrap your app with AuthProvider**:

```tsx
import { AuthProvider } from '@/components/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

2. **Use the auth store in components**:

```tsx
import { useAuthStore } from '@/lib/stores/auth';

function LoginForm() {
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (credentials) => {
    try {
      await login(credentials);
      // Redirect or update UI
    } catch (error) {
      // Handle error
    }
  };

  return (
    // Your login form JSX
  );
}
```

### Protected Routes

1. **Using ProtectedRoute component**:

```tsx
import { ProtectedRoute } from '@/components/auth';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

2. **Using auth hooks**:

```tsx
import { useRequireAuth } from '@/hooks';

function ProtectedComponent() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) return <Loading />;

  return <div>Welcome, {user.name}!</div>;
}
```

3. **Role-based protection**:

```tsx
import { useRequireRole } from '@/hooks';

function AdminPanel() {
  const { user, isAuthorized } = useRequireRole(['organization_admin']);

  if (!isAuthorized) return <Unauthorized />;

  return <AdminContent />;
}
```

### Next.js Middleware

Create `middleware.ts` in your project root:

```tsx
import { authMiddleware } from '@/lib/auth';

export default authMiddleware;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### API Integration

The auth system automatically handles token management for API requests:

```tsx
import { apiClient } from '@/lib/api/client';

// Tokens are automatically added to requests
const response = await apiClient.get('/protected-endpoint');
```

## Configuration

The auth system is highly configurable through `authConfig.ts`:

```tsx
export const AUTH_CONFIG = {
  TOKEN: {
    REFRESH_THRESHOLD_MINUTES: 5, // Refresh 5 minutes before expiration
    MAX_RETRY_ATTEMPTS: 3,
  },
  ROUTES: {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    PROTECTED_ROUTES: ['/dashboard', '/chat', '/tests'],
  },
  AUTO_REFRESH: {
    ENABLED: true,
    CHECK_INTERVAL_MINUTES: 1,
  },
  // ... more configuration options
};
```

## Security Features

### Token Storage

- **Access tokens**: Stored in session storage (cleared on browser close)
- **Refresh tokens**: Stored in local storage (persistent across sessions)
- **Automatic cleanup**: Tokens cleared on logout or expiration

### Token Refresh

- **Proactive refresh**: Tokens refreshed before expiration
- **Background refresh**: Non-blocking token refresh
- **Failure handling**: Automatic logout on refresh failure

### Cross-Tab Sync

- **Storage events**: Sync auth state across browser tabs
- **Logout propagation**: Logout in one tab affects all tabs
- **Login detection**: Detect login in other tabs

## Error Handling

The system provides comprehensive error handling:

```tsx
const { error, clearError } = useAuthStore();

// Display error messages
if (error) {
  return <ErrorMessage message={error} onClose={clearError} />;
}
```

Common error scenarios:

- Invalid credentials
- Token expiration
- Network errors
- Insufficient permissions
- Account locked

## Testing

The auth system includes comprehensive tests:

```bash
npm run test src/lib/stores/__tests__/auth.test.ts
```

Test coverage includes:

- Token management
- Login/logout flows
- Token refresh
- Error handling
- Route protection

## Hooks Reference

### Core Hooks

- `useAuthStore()`: Access to auth store state and actions
- `useAuth(options)`: Basic auth hook with redirect options
- `useTokenRefresh()`: Automatic token refresh management

### Route Protection Hooks

- `useRequireAuth()`: Require authentication
- `useRequireRole(roles)`: Require specific roles
- `useRequireAdmin()`: Require admin role
- `useRequireOrganization()`: Require organization role

### Utility Hooks

- `useCurrentUser()`: Get current user info with type helpers
- `useAuthActions()`: Get auth actions (login, logout, etc.)
- `useAuthGuard(options)`: Comprehensive route guard with options

## Components Reference

### Auth Providers

- `AuthProvider`: Basic auth initialization
- `EnhancedAuthProvider`: Advanced auth with cross-tab sync and auto-refresh

### Route Guards

- `ProtectedRoute`: Protect routes requiring authentication
- `PublicRoute`: Redirect authenticated users away from public routes

## Best Practices

1. **Always use TypeScript**: The system is fully typed for safety
2. **Handle loading states**: Show loading indicators during auth operations
3. **Implement error boundaries**: Catch and handle auth errors gracefully
4. **Use role-based access**: Implement proper authorization checks
5. **Test auth flows**: Write tests for critical auth functionality
6. **Monitor token expiration**: Handle token refresh failures appropriately
7. **Secure sensitive routes**: Use appropriate route guards
8. **Clear auth data on logout**: Ensure complete cleanup of user data

## Troubleshooting

### Common Issues

1. **Token not refreshing**: Check if auto-refresh is enabled in config
2. **Cross-tab sync not working**: Verify storage event listeners are set up
3. **Route protection not working**: Ensure middleware is configured correctly
4. **API requests failing**: Check if tokens are being added to requests
5. **Login redirects not working**: Verify redirect URLs in configuration

### Debug Mode

Enable debug logging by setting the log level:

```tsx
// In development
if (process.env.NODE_ENV === 'development') {
  console.log('Auth state:', useAuthStore.getState());
}
```

## Migration Guide

If migrating from an existing auth system:

1. Update imports to use new auth hooks
2. Replace old auth components with new ones
3. Update route protection logic
4. Migrate token storage format if needed
5. Update API client to use new middleware
6. Test all auth flows thoroughly

## Contributing

When contributing to the auth system:

1. Follow TypeScript best practices
2. Add tests for new functionality
3. Update documentation
4. Ensure backward compatibility
5. Test across different browsers
6. Consider security implications
