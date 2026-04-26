#!/usr/bin/env bash
set -euo pipefail

echo "Java:"
java -version

echo "Node:"
node --version
npm --version

echo "Maven:"
mvn --version

npm install

cat <<'INFO'

Plan Things devcontainer is ready.

Run the backend:
  cd services/api
  mvn spring-boot:run

Run the frontend:
  npm run dev:codespaces --workspace apps/web

Expected forwarded URLs:
  frontend: https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}
  backend:  https://${CODESPACE_NAME}-8080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}

Keep 5173 and 8080 public for OAuth/Gmail callbacks. Keep SQL Server private.
INFO
