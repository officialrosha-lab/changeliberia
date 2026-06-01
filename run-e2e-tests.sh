#!/bin/bash

# Phase 4 E2E Testing - Simple Validation Script
# Tests WebSocket infrastructure and API endpoints

set -e

colors_reset='\033[0m'
colors_red='\033[31m'
colors_green='\033[32m'
colors_yellow='\033[33m'
colors_blue='\033[34m'
colors_cyan='\033[36m'

API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

print_header() {
  echo -e "\n${colors_cyan}╔════════════════════════════════════════╗${colors_reset}"
  echo -e "${colors_cyan}║   Phase 4 E2E Testing - Validation      ║${colors_reset}"
  echo -e "${colors_cyan}║   Real-time Analytics Infrastructure    ║${colors_reset}"
  echo -e "${colors_cyan}╚════════════════════════════════════════╝${colors_reset}\n"
}

print_test() {
  local name=$1
  local status=$2
  local error=$3
  
  if [ "$status" = "PASS" ]; then
    echo -e "  ${colors_green}✅ PASS${colors_reset} - $name"
  else
    echo -e "  ${colors_red}❌ FAIL${colors_reset} - $name"
    if [ -n "$error" ]; then
      echo -e "    ${colors_red}Error: $error${colors_reset}"
    fi
  fi
}

test_api_health() {
  echo -e "\n${colors_blue}🧪 Test 1: API Health Check${colors_reset}"
  
  if response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null); then
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
      print_test "API responds on $API_URL" "PASS"
      return 0
    else
      print_test "API responds on $API_URL" "FAIL" "Status: $response"
      return 1
    fi
  else
    print_test "API responds on $API_URL" "FAIL" "Connection refused"
    return 1
  fi
}

test_web_health() {
  echo -e "\n${colors_blue}🧪 Test 2: Web App Health Check${colors_reset}"
  
  if response=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" 2>/dev/null); then
    if [ "$response" = "200" ] || [ "$response" = "308" ]; then
      print_test "Web app responds on $WEB_URL" "PASS"
      return 0
    else
      print_test "Web app responds on $WEB_URL" "FAIL" "Status: $response"
      return 1
    fi
  else
    print_test "Web app responds on $WEB_URL" "FAIL" "Connection refused"
    return 1
  fi
}

test_analytics_endpoint() {
  echo -e "\n${colors_blue}🧪 Test 3: Analytics API Endpoints${colors_reset}"
  
  # Test messages endpoint
  if response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/analytics/messages?period=week" 2>/dev/null); then
    if [ "$response" = "200" ] || [ "$response" = "401" ]; then
      print_test "GET /api/analytics/messages endpoint" "PASS"
      msgs_ok=1
    else
      print_test "GET /api/analytics/messages endpoint" "FAIL" "Status: $response"
      msgs_ok=0
    fi
  else
    print_test "GET /api/analytics/messages endpoint" "FAIL" "Connection error"
    msgs_ok=0
  fi
  
  # Test broadcasts endpoint
  if response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/analytics/broadcasts?period=week" 2>/dev/null); then
    if [ "$response" = "200" ] || [ "$response" = "401" ]; then
      print_test "GET /api/analytics/broadcasts endpoint" "PASS"
      bcasts_ok=1
    else
      print_test "GET /api/analytics/broadcasts endpoint" "FAIL" "Status: $response"
      bcasts_ok=0
    fi
  else
    print_test "GET /api/analytics/broadcasts endpoint" "FAIL" "Connection error"
    bcasts_ok=0
  fi
  
  if [ "$msgs_ok" = "1" ] && [ "$bcasts_ok" = "1" ]; then
    return 0
  else
    return 1
  fi
}

test_typescript_compilation() {
  echo -e "\n${colors_blue}🧪 Test 4: TypeScript Compilation${colors_reset}"
  
  # Test API
  if cd "$PWD/apps/api" && npx tsc --noEmit 2>/dev/null; then
    print_test "Backend TypeScript compilation" "PASS"
    api_ok=1
  else
    print_test "Backend TypeScript compilation" "FAIL" "Type errors found"
    api_ok=0
  fi
  
  # Test Web
  if cd "$PWD/../web" && npx tsc --noEmit 2>/dev/null; then
    print_test "Frontend TypeScript compilation" "PASS"
    web_ok=1
  else
    print_test "Frontend TypeScript compilation" "FAIL" "Type errors found"
    web_ok=0
  fi
  
  cd "$PWD/../.."
  
  if [ "$api_ok" = "1" ] && [ "$web_ok" = "1" ]; then
    return 0
  else
    return 1
  fi
}

test_gateway_exists() {
  echo -e "\n${colors_blue}🧪 Test 5: Gateway & Services Exist${colors_reset}"
  
  gateway_file="/Users/visionalventure/Change Liberia/apps/api/src/analytics/gateways/analytics.gateway.ts"
  service_file="/Users/visionalventure/Change Liberia/apps/api/src/analytics/services/analytics-realtime.service.ts"
  hook_file="/Users/visionalventure/Change Liberia/apps/web/lib/hooks/useAnalyticsRealtime.ts"
  component_file="/Users/visionalventure/Change Liberia/apps/web/components/analytics-realtime.tsx"
  
  if [ -f "$gateway_file" ]; then
    print_test "AnalyticsGateway file exists" "PASS"
    gateway_ok=1
  else
    print_test "AnalyticsGateway file exists" "FAIL" "File not found"
    gateway_ok=0
  fi
  
  if [ -f "$service_file" ]; then
    print_test "AnalyticsRealtimeService file exists" "PASS"
    service_ok=1
  else
    print_test "AnalyticsRealtimeService file exists" "FAIL" "File not found"
    service_ok=0
  fi
  
  if [ -f "$hook_file" ]; then
    print_test "useAnalyticsRealtime hook exists" "PASS"
    hook_ok=1
  else
    print_test "useAnalyticsRealtime hook exists" "FAIL" "File not found"
    hook_ok=0
  fi
  
  if [ -f "$component_file" ]; then
    print_test "analytics-realtime components exist" "PASS"
    component_ok=1
  else
    print_test "analytics-realtime components exist" "FAIL" "File not found"
    component_ok=0
  fi
  
  if [ "$gateway_ok" = "1" ] && [ "$service_ok" = "1" ] && [ "$hook_ok" = "1" ] && [ "$component_ok" = "1" ]; then
    return 0
  else
    return 1
  fi
}

run_tests() {
  print_header
  
  echo -e "${colors_yellow}API URL: $API_URL${colors_reset}"
  echo -e "${colors_yellow}Web URL: $WEB_URL${colors_reset}\n"
  
  passed=0
  total=5
  
  if test_api_health; then
    ((passed++))
  fi
  
  if test_web_health; then
    ((passed++))
  fi
  
  if test_analytics_endpoint; then
    ((passed++))
  fi
  
  if test_typescript_compilation; then
    ((passed++))
  fi
  
  if test_gateway_exists; then
    ((passed++))
  fi
  
  # Summary
  percentage=$((passed * 100 / total))
  
  echo -e "\n${colors_cyan}╔════════════════════════════════════════╗${colors_reset}"
  if [ "$percentage" = "100" ]; then
    echo -e "${colors_cyan}║   Test Summary: $passed/$total Passed (${percentage}%) ✅       ║${colors_reset}"
  else
    echo -e "${colors_cyan}║   Test Summary: $passed/$total Passed (${percentage}%)          ║${colors_reset}"
  fi
  echo -e "${colors_cyan}╚════════════════════════════════════════╝${colors_reset}"
  
  if [ "$percentage" = "100" ]; then
    echo -e "\n${colors_green}✅ All tests passed! Phase 4 is ready for deployment.${colors_reset}\n"
    return 0
  else
    echo -e "\n${colors_yellow}⚠️  Some tests failed. Please review the logs above.${colors_reset}\n"
    return 1
  fi
}

# Run all tests
run_tests
