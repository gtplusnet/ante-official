#!/bin/bash

################################################################################
# GitHub Actions Runner Health Check Script
# Purpose: Monitor 3 local runners, auto-restart failures, send alerts
# Author: Auto-generated for ante-official project
# Created: 2025-10-08
################################################################################

set -euo pipefail

# Configuration
RUNNERS=(
  "actions.runner.gtplusnet-ante-official.local-staging-runner.service"
  "actions.runner.gtplusnet-ante-official.local-staging-runner-2.service"
  "actions.runner.gtplusnet-ante-official.local-staging-runner-3.service"
)

RUNNER_NAMES=(
  "local-staging-runner"
  "local-staging-runner-2"
  "local-staging-runner-3"
)

RUNNER_DIRS=(
  "$HOME/actions-runner"
  "$HOME/actions-runner-2"
  "$HOME/actions-runner-3"
)

# Telegram configuration (from CLAUDE.local.md)
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-7384340051:AAGSodoluqPV--UmpAtTb7IIPrgqROSZKg0}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:--4574425379}"
TELEGRAM_ENABLED="${TELEGRAM_ENABLED:-true}"

# Thresholds
MAX_CPU_PERCENT=80
MAX_MEM_PERCENT=80
MAX_STUCK_TIME=3600  # 1 hour in seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Send Telegram notification
send_telegram() {
  local message="$1"

  if [[ "$TELEGRAM_ENABLED" != "true" ]]; then
    return 0
  fi

  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${message}" \
    -d "parse_mode=HTML" \
    > /dev/null 2>&1 || true
}

# Check if runner service is active
check_service_status() {
  local service="$1"
  systemctl is-active "$service" > /dev/null 2>&1
}

# Get service status string
get_service_status() {
  local service="$1"
  systemctl show -p ActiveState --value "$service" 2>/dev/null || echo "unknown"
}

# Check GitHub connectivity for a runner via GitHub API
check_github_connectivity() {
  local runner_name="$1"

  # Use GitHub API to check if runner is online
  # This is more reliable than log parsing
  local runner_status=$(gh api repos/gtplusnet/ante-official/actions/runners 2>/dev/null | \
    jq -r ".runners[] | select(.name == \"$runner_name\") | .status" 2>/dev/null)

  if [[ "$runner_status" == "online" ]]; then
    return 0
  fi

  return 1
}

# Detect stuck runner processes
check_stuck_process() {
  local runner_name="$1"

  # Find Runner.Worker processes
  local worker_pids=$(pgrep -f "Runner.Worker.*$runner_name" || true)

  if [[ -z "$worker_pids" ]]; then
    return 1  # No workers running
  fi

  # Check process runtime
  for pid in $worker_pids; do
    local runtime=$(ps -p "$pid" -o etimes= 2>/dev/null | tr -d ' ' || echo "0")
    if [[ $runtime -gt $MAX_STUCK_TIME ]]; then
      return 0  # Stuck process detected
    fi
  done

  return 1  # No stuck processes
}

# Get resource usage for runner
get_resource_usage() {
  local service="$1"

  local main_pid=$(systemctl show -p MainPID --value "$service" 2>/dev/null)

  if [[ -z "$main_pid" ]] || [[ "$main_pid" == "0" ]]; then
    echo "CPU: N/A, MEM: N/A"
    return
  fi

  # Get all child processes
  local all_pids=$(pstree -p "$main_pid" | grep -o '([0-9]\+)' | grep -o '[0-9]\+' | tr '\n' ',' | sed 's/,$//')

  if [[ -z "$all_pids" ]]; then
    echo "CPU: 0%, MEM: 0%"
    return
  fi

  # Calculate total CPU and MEM
  local cpu_total=$(ps -p "$all_pids" -o %cpu= 2>/dev/null | awk '{sum+=$1} END {printf "%.1f", sum}' || echo "0.0")
  local mem_total=$(ps -p "$all_pids" -o %mem= 2>/dev/null | awk '{sum+=$1} END {printf "%.1f", sum}' || echo "0.0")

  echo "CPU: ${cpu_total}%, MEM: ${mem_total}%"
}

# Restart runner service
restart_runner() {
  local service="$1"
  local runner_name="$2"

  log "${YELLOW}Restarting $runner_name...${NC}"

  if echo "water123" | sudo -S systemctl restart "$service" 2>/dev/null; then
    log "${GREEN}Successfully restarted $runner_name${NC}"
    send_telegram "🔄 <b>Runner Restarted</b>%0A%0ARunner: $runner_name%0ATime: $(date +'%Y-%m-%d %H:%M:%S')%0AStatus: Service restarted successfully"
    return 0
  else
    log "${RED}Failed to restart $runner_name${NC}"
    send_telegram "❌ <b>Restart Failed</b>%0A%0ARunner: $runner_name%0ATime: $(date +'%Y-%m-%d %H:%M:%S')%0AError: Could not restart service"
    return 1
  fi
}

# Main health check loop
main() {
  log "Starting GitHub Runner health check..."

  local issues_found=0
  local runners_checked=0

  for i in "${!RUNNERS[@]}"; do
    local service="${RUNNERS[$i]}"
    local runner_name="${RUNNER_NAMES[$i]}"
    local runner_dir="${RUNNER_DIRS[$i]}"

    runners_checked=$((runners_checked + 1))

    log "Checking $runner_name..."

    # Check service status
    if ! check_service_status "$service"; then
      local status=$(get_service_status "$service")
      log "${RED}ISSUE: $runner_name service is $status${NC}"
      issues_found=$((issues_found + 1))

      send_telegram "⚠️ <b>Runner Service Down</b>%0A%0ARunner: $runner_name%0AStatus: $status%0AAction: Attempting restart..."

      restart_runner "$service" "$runner_name"
      continue
    fi

    # Check GitHub connectivity
    if ! check_github_connectivity "$runner_name"; then
      log "${YELLOW}WARNING: $runner_name may not be connected to GitHub${NC}"
      issues_found=$((issues_found + 1))

      send_telegram "⚠️ <b>GitHub Connection Issue</b>%0A%0ARunner: $runner_name%0AStatus: Not connected to GitHub%0AAction: Attempting restart..."

      restart_runner "$service" "$runner_name"
      continue
    fi

    # Check for stuck processes
    if check_stuck_process "$runner_name"; then
      log "${RED}ISSUE: $runner_name has stuck worker process${NC}"
      issues_found=$((issues_found + 1))

      send_telegram "⚠️ <b>Stuck Process Detected</b>%0A%0ARunner: $runner_name%0AStatus: Worker running > 1 hour%0AAction: Attempting restart..."

      restart_runner "$service" "$runner_name"
      continue
    fi

    # Check resource usage
    local resources=$(get_resource_usage "$service")
    log "${GREEN}OK: $runner_name - $resources${NC}"
  done

  # Summary
  log "Health check complete: $runners_checked runners checked, $issues_found issues found"

  if [[ $issues_found -eq 0 ]]; then
    # Only send success notification once per day (check if last success was > 24h ago)
    local success_flag="/tmp/.runner-health-last-success"
    local current_time=$(date +%s)

    if [[ ! -f "$success_flag" ]] || [[ $((current_time - $(cat "$success_flag" 2>/dev/null || echo 0))) -gt 86400 ]]; then
      send_telegram "✅ <b>All Runners Healthy</b>%0A%0ARunners: ${#RUNNERS[@]}%0AStatus: All services active and connected%0ATime: $(date +'%Y-%m-%d %H:%M:%S')"
      echo "$current_time" > "$success_flag"
    fi
  fi

  # Always return 0 for systemd success (issues were handled by auto-restart)
  return 0
}

# Run main function
main "$@"
