#!/bin/bash
# Activity scheduler for Crusty
# Randomly triggers activities with natural timing variation

SCRIPT_DIR="$(dirname "$0")"
HANDLER="$SCRIPT_DIR/cron-handler.js"
LOG="/tmp/crusty-activity.log"

# Add PATH for node
export PATH="/root/.nvm/versions/node/v24.13.0/bin:$PATH"

activity="$1"

# Add random delay (0-120 seconds) for more natural timing
if [ "$2" != "--now" ]; then
  delay=$((RANDOM % 120))
  echo "$(date): Scheduling $activity in ${delay}s" >> "$LOG"
  sleep $delay
fi

echo "$(date): Running activity: $activity" >> "$LOG"
node "$HANDLER" "$activity" >> "$LOG" 2>&1
