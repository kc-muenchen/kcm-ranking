#!/bin/sh
set -e

# Generate runtime config.js from environment variable
API_URL="${VITE_API_URL:-http://localhost:3001}"

cat > /usr/share/nginx/html/config.js <<EOF
window.APP_CONFIG = {
  API_URL: '${API_URL}'
};
EOF

echo "Generated config.js with API_URL: ${API_URL}"

# Start nginx
exec nginx -g "daemon off;"

