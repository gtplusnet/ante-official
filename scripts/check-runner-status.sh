#!/bin/bash

################################################################################
# GitHub Actions Runner Status Dashboard
# Purpose: Quick status overview of all local runners
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

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Get service status with color
get_service_status() {
  local service="$1"

  if systemctl is-active "$service" > /dev/null 2>&1; then
    echo -e "${GREEN}●${NC} active"
  else
    local status=$(systemctl show -p ActiveState --value "$service" 2>/dev/null || echo "unknown")
    echo -e "${RED}●${NC} $status"
  fi
}

# Check GitHub connectivity via GitHub API
check_github_status() {
  local runner_name="$1"

  # Use GitHub API to check if runner is online (more reliable than log parsing)
  local runner_status=$(gh api repos/gtplusnet/ante-official/actions/runners 2>/dev/null | \
    jq -r ".runners[] | select(.name == \"$runner_name\") | .status" 2>/dev/null)

  if [[ "$runner_status" == "online" ]]; then
    echo -e "${GREEN}online${NC}"
  elif [[ "$runner_status" == "offline" ]]; then
    echo -e "${RED}offline${NC}"
  else
    echo -e "${YELLOW}unknown${NC}"
  fi
}

# Get resource usage
get_resource_usage() {
  local service="$1"

  local main_pid=$(systemctl show -p MainPID --value "$service" 2>/dev/null)

  if [[ -z "$main_pid" ]] || [[ "$main_pid" == "0" ]]; then
    echo -e "${YELLOW}N/A${NC}"
    return
  fi

  # Get all child processes
  local all_pids=$(pstree -p "$main_pid" 2>/dev/null | grep -o '([0-9]\+)' | grep -o '[0-9]\+' | tr '\n' ',' | sed 's/,$//' || echo "")

  if [[ -z "$all_pids" ]]; then
    echo "0.0% / 0.0%"
    return
  fi

  # Calculate total CPU and MEM
  local cpu_total=$(ps -p "$all_pids" -o %cpu= 2>/dev/null | awk '{sum+=$1} END {printf "%.1f", sum}' || echo "0.0")
  local mem_total=$(ps -p "$all_pids" -o %mem= 2>/dev/null | awk '{sum+=$1} END {printf "%.1f", sum}' || echo "0.0")

  echo "${cpu_total}% / ${mem_total}%"
}

# Get uptime
get_uptime() {
  local service="$1"

  local active_since=$(systemctl show -p ActiveEnterTimestamp --value "$service" 2>/dev/null)

  if [[ -z "$active_since" ]] || [[ "$active_since" == "0" ]]; then
    echo -e "${YELLOW}N/A${NC}"
    return
  fi

  local since_epoch=$(date -d "$active_since" +%s 2>/dev/null || echo "0")
  local now_epoch=$(date +%s)
  local uptime_seconds=$((now_epoch - since_epoch))

  # Format uptime
  local days=$((uptime_seconds / 86400))
  local hours=$(( (uptime_seconds % 86400) / 3600 ))
  local minutes=$(( (uptime_seconds % 3600) / 60 ))

  if [[ $days -gt 0 ]]; then
    echo "${days}d ${hours}h"
  elif [[ $hours -gt 0 ]]; then
    echo "${hours}h ${minutes}m"
  else
    echo "${minutes}m"
  fi
}

# Get recent job count from logs
get_recent_jobs() {
  local runner_dir="$1"

  if [[ ! -d "$runner_dir/_diag" ]]; then
    echo "0"
    return
  fi

  # Count "Running job:" entries in last 24 hours
  local count=$(find "$runner_dir/_diag" -name "Runner_*.log" -mtime -1 -exec grep -c "Running job:" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")

  echo "$count"
}

# Show detailed status for a specific runner
show_runner_detail() {
  local index="$1"
  local service="${RUNNERS[$index]}"
  local runner_name="${RUNNER_NAMES[$index]}"
  local runner_dir="${RUNNER_DIRS[$index]}"

  echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}Runner: $runner_name${NC}"
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

  echo -e "${BOLD}Service Status:${NC}"
  systemctl status "$service" --no-pager -l | head -20

  echo -e "\n${BOLD}GitHub Connection:${NC}"
  local github_status=$(check_github_status "$runner_name")
  echo -e "  Status: $github_status"

  echo -e "\n${BOLD}Resource Usage:${NC}"
  local resources=$(get_resource_usage "$service")
  echo -e "  CPU / Memory: $resources"

  echo -e "\n${BOLD}Uptime:${NC}"
  local uptime=$(get_uptime "$service")
  echo -e "  Running for: $uptime"

  echo -e "\n${BOLD}Recent Jobs (24h):${NC}"
  local jobs=$(get_recent_jobs "$runner_dir")
  echo -e "  Jobs executed: $jobs"

  echo -e "\n${BOLD}Process Tree:${NC}"
  local main_pid=$(systemctl show -p MainPID --value "$service" 2>/dev/null)
  if [[ -n "$main_pid" ]] && [[ "$main_pid" != "0" ]]; then
    pstree -p "$main_pid" 2>/dev/null || echo "  No process tree available"
  else
    echo "  Service not running"
  fi

  echo -e "\n${BOLD}Recent Logs:${NC}"
  journalctl -u "$service" -n 10 --no-pager 2>/dev/null || echo "  No logs available"

  echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Show summary table of all runners
show_all_runners() {
  echo -e "\n${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║                    GitHub Actions Runner Status Dashboard                     ║${NC}"
  echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════════════════════╝${NC}\n"

  echo -e "${BOLD}Generated: $(date +'%Y-%m-%d %H:%M:%S')${NC}\n"

  # Table header
  printf "${BOLD}%-25s %-15s %-15s %-18s %-12s %-10s${NC}\n" \
    "RUNNER" "SERVICE" "GITHUB" "CPU / MEM" "UPTIME" "JOBS (24h)"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Table rows
  for i in "${!RUNNERS[@]}"; do
    local service="${RUNNERS[$i]}"
    local runner_name="${RUNNER_NAMES[$i]}"
    local runner_dir="${RUNNER_DIRS[$i]}"

    local service_status=$(get_service_status "$service")
    local github_status=$(check_github_status "$runner_name")
    local resources=$(get_resource_usage "$service")
    local uptime=$(get_uptime "$service")
    local jobs=$(get_recent_jobs "$runner_dir")

    printf "%-32s %-22s %-22s %-18s %-12s %-10s\n" \
      "$runner_name" "$service_status" "$github_status" "$resources" "$uptime" "$jobs"
  done

  echo -e "\n${BOLD}Legend:${NC}"
  echo -e "  ${GREEN}●${NC} active    - Service is running"
  echo -e "  ${RED}●${NC} inactive  - Service is stopped"
  echo -e "  ${GREEN}online${NC}    - Connected to GitHub"
  echo -e "  ${RED}offline${NC}   - Not connected to GitHub"

  echo -e "\n${BOLD}Quick Commands:${NC}"
  echo -e "  View specific runner:  $0 <runner-name>"
  echo -e "  Restart runner:        sudo systemctl restart <service-name>"
  echo -e "  View logs:             journalctl -u <service-name> -f"
  echo -e "  Trigger health check:  ~/projects/ante-official/scripts/runner-health-check.sh"

  echo ""
}

# Main function
main() {
  local runner_filter="${1:-}"

  # If runner name provided, show detailed view
  if [[ -n "$runner_filter" ]]; then
    local found=0
    for i in "${!RUNNER_NAMES[@]}"; do
      if [[ "${RUNNER_NAMES[$i]}" == "$runner_filter" ]]; then
        show_runner_detail "$i"
        found=1
        break
      fi
    done

    if [[ $found -eq 0 ]]; then
      echo -e "${RED}Error: Runner '$runner_filter' not found${NC}"
      echo -e "\nAvailable runners:"
      for name in "${RUNNER_NAMES[@]}"; do
        echo "  - $name"
      done
      exit 1
    fi
  else
    # Show summary of all runners
    show_all_runners
  fi
}

# Run main function
main "$@"
