FROM ghost:5-alpine

RUN apk add --no-cache fontconfig ttf-freefont rsync

# Copy theme to temp dir (persists through build, copied at runtime)
COPY content/themes/defalt /tmp/defalt-theme

# Copy custom entrypoint
COPY docker-entrypoint.sh /usr/local/bin/custom-entrypoint.sh
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["node", "current/index.js"]
