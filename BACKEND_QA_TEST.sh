#!/bin/bash

# Comprehensive Backend QA Test Suite
# OpenClaw Command Center - Backend API Testing

BASE_URL="http://localhost:3001"
TIMESTAMP=$(date +%s)

echo "======================================"
echo "OpenClaw Backend QA Test Suite"
echo "======================================"
echo "Timestamp: $(date)"
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
PASSED=0
FAILED=0
TOTAL=0

test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"

    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] Testing: $test_name... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    elif [ "$method" == "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint" 2>&1)
    elif [ "$method" == "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "    Response: $body" | head -c 200
            echo ""
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, Got $http_code)"
        FAILED=$((FAILED + 1))
        if [ -n "$body" ]; then
            echo "    Error: $body"
        fi
    fi
    echo ""
}

echo "======================================"
echo "Phase 1: Gateway & System Health"
echo "======================================"

test_endpoint "Gateway Status" "GET" "/api/gateway/status" "" "200"

echo ""
echo "======================================"
echo "Phase 2: Agent Management (CRUD)"
echo "======================================"

# Create Agent
test_endpoint "Create Agent 1" "POST" "/api/agents" \
'{
  "id": "agent-qa-001",
  "name": "QA Test Agent 1",
  "type": "conversational",
  "status": "active",
  "description": "Agent created during QA testing",
  "capabilities": ["chat", "reasoning"],
  "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}' "201"

test_endpoint "Create Agent 2" "POST" "/api/agents" \
'{
  "id": "agent-qa-002",
  "name": "QA Test Agent 2",
  "type": "task",
  "status": "idle",
  "description": "Second test agent",
  "capabilities": ["automation"],
  "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}' "201"

# List Agents
test_endpoint "List All Agents" "GET" "/api/agents" "" "200"

# Update Agent
test_endpoint "Update Agent Status" "PUT" "/api/agents/agent-qa-001" \
'{
  "status": "busy"
}' "200"

# Get Agent Heartbeats
test_endpoint "Get Agent Heartbeats" "GET" "/api/status/agents" "" "200"

# Send Heartbeat
test_endpoint "Send Heartbeat" "POST" "/api/status/heartbeat/agent-qa-001" "" "200"

echo ""
echo "======================================"
echo "Phase 3: Conversation Management"
echo "======================================"

# Create Conversations
test_endpoint "Create Conversation 1" "POST" "/api/conversations" \
'{
  "agentId": "agent-qa-001",
  "title": "QA Test Conversation"
}' "201"

# Save conversation ID for later (this is a simplified version)
CONV_ID=$(curl -s -X POST "$BASE_URL/api/conversations" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agent-qa-001","title":"Conversation for Messages"}' | \
  grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

test_endpoint "List Conversations" "GET" "/api/conversations" "" "200"

if [ -n "$CONV_ID" ]; then
    test_endpoint "Get Specific Conversation" "GET" "/api/conversations/$CONV_ID" "" "200"

    # Add Messages
    test_endpoint "Add Message to Conversation" "POST" "/api/conversations/$CONV_ID/messages" \
'{
  "id": "msg-001",
  "conversationId": "'$CONV_ID'",
  "senderType": "user",
  "text": "Hello, this is a test message",
  "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}' "201"

    test_endpoint "Switch Agent in Conversation" "PATCH" "/api/conversations/$CONV_ID/agent" \
'{
  "agentId": "agent-qa-002"
}' "200"
fi

echo ""
echo "======================================"
echo "Phase 4: Skills & Cron Jobs"
echo "======================================"

test_endpoint "List Skills" "GET" "/api/skills" "" "200"

test_endpoint "List Cron Jobs" "GET" "/api/cron/jobs" "" "200"

# Create Cron Job
test_endpoint "Create Cron Job" "POST" "/api/cron/jobs" \
'{
  "id": "cron-qa-001",
  "name": "QA Test Cron",
  "schedule": "0 * * * *",
  "playbookId": "test-playbook",
  "enabled": false
}' "201"

echo ""
echo "======================================"
echo "Phase 5: Security & Permissions"
echo "======================================"

test_endpoint "Get Permission Rules" "GET" "/api/permissions/rules" "" "200"

test_endpoint "Get Pending Approvals" "GET" "/api/permissions/approvals" "" "200"

test_endpoint "Get Audit Log" "GET" "/api/permissions/audit" "" "200"

echo ""
echo "======================================"
echo "Phase 6: Cleanup Tests"
echo "======================================"

# Delete Conversation
if [ -n "$CONV_ID" ]; then
    test_endpoint "Delete Conversation" "DELETE" "/api/conversations/$CONV_ID" "" "204"
fi

# Delete Agents
test_endpoint "Delete Agent 1" "DELETE" "/api/agents/agent-qa-001" "" "204"
test_endpoint "Delete Agent 2" "DELETE" "/api/agents/agent-qa-002" "" "204"

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
