#!/bin/bash

# OpenClaw Dashboard API Test Script
BASE_URL="http://localhost:3001"

echo "==================================="
echo "OpenClaw Command Center API Tests"
echo "==================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"

    echo -n "Testing $name... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($http_code)"
        [ -n "$body" ] && echo "  Response: $body"
    elif [ "$http_code" == "404" ]; then
        echo -e "${YELLOW}⚠ NOT FOUND${NC} ($http_code)"
    else
        echo -e "${RED}✗ FAIL${NC} ($http_code)"
        [ -n "$body" ] && echo "  Error: $body"
    fi
    echo ""
}

echo "Phase 0: Environment Setup"
echo "======================================"
test_endpoint "Gateway Status" "GET" "/api/gateway/status"

echo ""
echo "Phase 1: Core Endpoints"
echo "======================================"
test_endpoint "List Agents" "GET" "/api/agents"
test_endpoint "Agent Heartbeats" "GET" "/api/status/agents"
test_endpoint "List Conversations" "GET" "/api/conversations"
test_endpoint "List Skills" "GET" "/api/skills"

echo ""
echo "Phase 2: System Components"
echo "======================================"
test_endpoint "Cron Jobs" "GET" "/api/cron/jobs"
test_endpoint "Permission Rules" "GET" "/api/permissions/rules"
test_endpoint "Pending Approvals" "GET" "/api/permissions/approvals"
test_endpoint "Audit Log" "GET" "/api/permissions/audit"

echo ""
echo "======================================"
echo "API Test Summary Complete"
echo "======================================"
