# Admin Dashboard Access

## Security Implementation

This application separates public APIs from admin access for security purposes.

### Public API Access
- **License Validation**: `POST /api/licenses/validate`
- **External License Creation**: `POST /api/licenses/create` (requires API key)

### Admin Dashboard Access

The admin dashboard is accessible through a custom, configurable path to prevent discovery through API exploration.

#### Default Configuration
- **Admin Path**: Configured in `.env.local` as `ADMIN_PATH`
- **Default Path**: `secure-admin-panel-xyz123`

#### Accessing the Admin Dashboard

1. **Login URL**: `https://yoursite.com/{ADMIN_PATH}/login`
2. **Dashboard URL**: `https://yoursite.com/{ADMIN_PATH}/`
3. **Applications**: `https://yoursite.com/{ADMIN_PATH}/applications`
4. **Validation Logs**: `https://yoursite.com/{ADMIN_PATH}/validation-logs`

#### Example URLs (with default config)
- Login: `http://localhost:3000/secure-admin-panel-xyz123/login`
- Dashboard: `http://localhost:3000/secure-admin-panel-xyz123/`

#### Security Features

1. **Path Obfuscation**: Admin path is configurable and non-obvious
2. **Direct Access Blocking**: Direct access to admin pages returns 404
3. **Middleware Protection**: All requests are validated through middleware
4. **Referer Checking**: Ensures requests come through proper admin path

#### Configuration

Update your `.env.local`:

```env
# Admin Configuration
ADMIN_PATH="your-custom-admin-path-here"
ADMIN_SECRET_KEY="your-secret-key"
```

#### Admin Credentials

After running the seed script, you'll have an admin user with the following credentials:
- **Username**: jsparks
- **Password**: admin123

⚠️ **Important**: Change the default admin password in production!

## Security Best Practices

1. **Change Admin Path**: Use a unique, hard-to-guess admin path
2. **Use HTTPS**: Always use HTTPS in production
3. **Strong Passwords**: Change default admin credentials immediately after setup
4. **Environment Variables**: Keep sensitive config in environment variables
5. **Regular Rotation**: Rotate admin paths and credentials regularly

## Troubleshooting

### Cannot Access Admin Dashboard
1. Verify the admin path in your `.env.local`
2. Check that you're using the full admin URL
3. Clear browser cache and cookies
4. Ensure you're not accessing admin pages directly

### 404 Errors
- Direct access to admin pages is blocked by design
- Always access through the configured admin path 