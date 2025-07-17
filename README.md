# License Management System

A comprehensive web application for creating and validating software licenses built with Next.js, TypeScript, and Prisma.

## Features

- 🔐 **Secure License Generation** - Create unique license codes with API key protection
- ✅ **License Validation** - Public API endpoint for validating licenses
- 📊 **Admin Dashboard** - Web interface to manage and monitor licenses
- 🔍 **Search & Filter** - Find licenses by code or email
- 📅 **Expiration Tracking** - Monitor license expiration dates
- 🏷️ **License Types** - Support for Trial and Purchased licenses

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.local .env.local
   
   # Generate a secure API key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Update .env.local with your values
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Create and migrate database
   npx prisma db push
   ```

4. **Seed initial API key (optional)**
   ```bash
   # You can create API keys through the database or add this to a seed script
   # We'll create one programmatically in the next step
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Visit the application**
   - Admin Dashboard: http://localhost:3000
   - API Documentation: See below

## API Documentation

### Authentication

All license creation endpoints require an API key in the header:
```
x-api-key: your-api-key-here
```

### Endpoints

#### Create License
**POST** `/api/licenses/create`

Creates a new license with the provided details.

**Headers:**
```
Content-Type: application/json
x-api-key: your-api-key-here
```

**Request Body:**
```json
{
  "type": "TRIAL" | "PURCHASED",
  "expiryDate": "2024-12-31T23:59:59.000Z",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "license": {
    "id": "clp1...",
    "code": "ABCD-1234-EFGH-5678",
    "type": "TRIAL",
    "expiryDate": "2024-12-31T23:59:59.000Z",
    "email": "user@example.com",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Validate License
**POST** `/api/licenses/validate`

Validates a license using both code and email (public endpoint, no API key required).

**Request Body:**
```json
{
  "code": "ABCD-1234-EFGH-5678",
  "email": "user@example.com"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "license": {
    "code": "ABCD-1234-EFGH-5678",
    "type": "TRIAL",
    "expiryDate": "2024-12-31T23:59:59.000Z",
    "email": "user@example.com"
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "reason": "License is invalid"
}
```

#### List Licenses (Admin)
**GET** `/api/admin/licenses`

Retrieves paginated list of all licenses.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by license code or email

**Response:**
```json
{
  "licenses": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Usage Examples

### Create a Trial License
```bash
curl -X POST http://localhost:3000/api/licenses/create \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "type": "TRIAL",
    "expiryDate": "2024-12-31T23:59:59.000Z",
    "email": "trial@example.com"
  }'
```

### Validate a License
```bash
curl -X POST http://localhost:3000/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ABCD-1234-EFGH-5678",
    "email": "user@example.com"
  }'
```

## Managing API Keys

Currently, API keys need to be managed through the database directly. Here's how to create a new API key:

1. **Generate a secure key:**
   ```bash
   node -e "
   const crypto = require('crypto');
   const key = crypto.randomBytes(32).toString('hex');
   const hash = crypto.createHash('sha256').update(key).digest('hex');
   console.log('API Key:', key);
   console.log('Hash (store this):', hash);
   "
   ```

2. **Add to database:**
   ```sql
   INSERT INTO api_keys (id, key, name, isActive) 
   VALUES ('unique-id', 'hashed-key-from-above', 'Key Name', 1);
   ```

## Database Schema

The application uses the following main models:

- **License**: Stores license information (code, type, expiry, email)
- **ApiKey**: Stores hashed API keys for authentication

See `prisma/schema.prisma` for the complete schema.

## Development

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate client after schema changes
npx prisma generate
```

### Building for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Security Considerations

1. **API Keys**: Store API keys securely and use environment variables
2. **Database**: Use a proper database (PostgreSQL/MySQL) in production
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Consider implementing rate limiting for public endpoints
5. **Input Validation**: All inputs are validated, but review for your use case

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on the GitHub repository or contact the development team. 