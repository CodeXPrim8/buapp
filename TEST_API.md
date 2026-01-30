# API Testing Guide

## ✅ Database Setup Complete!

Your database schema has been successfully created. Now let's test the API endpoints.

## Prerequisites

1. ✅ Database schema created
2. ✅ `.env.local` file created with Supabase credentials
3. Development server running: `npm run dev`

## Testing API Endpoints

### 1. Test User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+2341234567890",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "role": "user",
    "pin": "1234"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "phone_number": "+2341234567890",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "message": "User registered successfully"
  }
}
```

### 2. Test User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+2341234567890",
    "pin": "1234"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "phone_number": "+2341234567890",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "message": "Login successful"
  }
}
```

### 3. Test Gateway Creation (Vendor)

First, register a vendor:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+2349876543210",
    "first_name": "Vendor",
    "last_name": "Test",
    "role": "vendor",
    "pin": "5678"
  }'
```

Then create a gateway (note: you'll need to add authentication headers):
```bash
curl -X POST http://localhost:3000/api/gateways \
  -H "Content-Type: application/json" \
  -H "x-user-id: <vendor_user_id>" \
  -H "x-user-role: vendor" \
  -d '{
    "event_name": "Test Wedding",
    "event_date": "2024-12-25",
    "event_time": "14:00",
    "event_location": "Lagos",
    "celebrant_unique_id": "+2341234567890",
    "celebrant_name": "John Doe"
  }'
```

## Testing with Postman

1. Import the collection (create one with the endpoints above)
2. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `user_id`: (from registration response)
   - `vendor_id`: (from vendor registration)

## Testing with Browser/Thunder Client

Use the browser's developer console or VS Code Thunder Client extension:

1. **Register User:**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/register`
   - Body: JSON with user data

2. **Login:**
   - Method: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Body: JSON with phone_number and pin

## Common Issues

### Issue: "Unauthorized" errors
**Solution:** Make sure you're including the `x-user-id` and `x-user-role` headers for protected endpoints.

### Issue: "User with this phone number already exists"
**Solution:** Use a different phone number or delete the test user from Supabase.

### Issue: "Gateway not found"
**Solution:** Make sure you've created a gateway first and are using the correct gateway ID.

### Issue: Connection errors
**Solution:** 
- Verify `.env.local` has correct Supabase credentials
- Check Supabase project is active
- Verify network connection

## Next Steps

1. ✅ Test registration and login
2. ✅ Test gateway creation
3. ⏳ Test BU transfers
4. ⏳ Test notifications
5. ⏳ Update frontend to use API endpoints

## Frontend Integration

Once API endpoints are tested, update the frontend components to:
- Replace `localStorage` with API calls
- Add proper error handling
- Add loading states
- Implement JWT authentication
