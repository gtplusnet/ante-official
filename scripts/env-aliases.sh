#!/bin/bash

# ANTE Environment Aliases
# Add this to your shell profile (~/.bashrc or ~/.zshrc):
# source ~/projects/ante/scripts/env-aliases.sh

# Get the directory where this script is located
ANTE_SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Environment switching aliases
alias ante-staging="${ANTE_SCRIPTS_DIR}/switch-env.sh staging"
alias ante-production="${ANTE_SCRIPTS_DIR}/switch-env.sh production"
alias ante-env="${ANTE_SCRIPTS_DIR}/switch-env.sh status"

# Quick status check
alias ante-status="ante-env"

# Print available commands when sourced
echo "ANTE Environment Aliases loaded!"
echo "Available commands:"
echo "  ante-staging     - Switch to staging database"
echo "  ante-production  - Switch to production database"
echo "  ante-env         - Show current environment"
echo "  ante-status      - Show current environment (alias for ante-env)"