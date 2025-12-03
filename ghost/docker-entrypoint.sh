#!/bin/sh
set -e

# Copy/update theme to volume BEFORE starting Ghost
if [ -d "/tmp/defalt-theme" ]; then
  THEME_DIR="/var/lib/ghost/content/themes/defalt"
  mkdir -p "$THEME_DIR"
  # Rsync for efficient update (only changed files)
  rsync -av --delete /tmp/defalt-theme/ "$THEME_DIR/"
  echo "Updated defalt theme in $THEME_DIR"
  rm -rf /tmp/defalt-theme  # Cleanup
fi

# Execute the original Ghost entrypoint with all args
exec /usr/local/bin/docker-entrypoint.sh "$@"
