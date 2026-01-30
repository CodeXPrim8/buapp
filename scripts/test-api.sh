#!/bin/bash

# API Testing Script
# Usage: ./scripts/test-api.sh

BASE_URL="http://localhost:3000"

echo "🧪 Testing ɃU API Endpoints"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register User
echo -e "${YELLOW}Test 1: Register User${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+2341234567890",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "role": "user",
    "pin": "1234"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract user ID if registration successful
USER_ID=$(echo "$RESPONSE" | jq -r '.data.user.id' 2>/dev/null)

if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
  echo -e "${GREEN}✅ User registered successfully${NC}"
  echo "User ID: $USER_ID"
else
  echo -e "${RED}❌ Registration failed${NC}"
fi

echo ""
echo "================================"
echo ""

# Test 2: Login
echo -e "${YELLOW}Test 2: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+2341234567890",
    "pin": "1234"
  }')

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

SUCCESS=$(echo "$LOGIN_RESPONSE" | jq -r '.success' 2>/dev/null)
if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Login successful${NC}"
else
  echo -e "${RED}❌ Login failed${NC}"
fi

echo ""
echo "================================"
echo ""

# Test 3: Get Notifications (requires auth)
if [ -n "$USER_ID" ]; then
  echo -e "${YELLOW}Test 3: Get Notifications${NC}"
  NOTIF_RESPONSE=$(curl -s -X GET "$BASE_URL/api/notifications" \
    -H "x-user-id: $USER_ID" \
    -H "x-user-role: user")
  
  echo "$NOTIF_RESPONSE" | jq '.' 2>/dev/null || echo "$NOTIF_RESPONSE"
  echo ""
  
  SUCCESS=$(echo "$NOTIF_RESPONSE" | jq -r '.success' 2>/dev/null)
  if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ Notifications endpoint working${NC}"
  else
    echo -e "${RED}❌ Notifications endpoint failed${NC}"
  fi
fi

echo ""
echo "================================"
echo ""
echo "✨ Testing complete!"
