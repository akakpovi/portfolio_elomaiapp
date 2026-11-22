#!/usr/bin/env bash
# Headless Matomo installation.
#
# The official image installs through a web wizard. This script performs the
# same steps over HTTP so the instance can be provisioned reproducibly without
# a browser and without ever exposing the admin UI publicly.
#
# Required environment:
#   MATOMO_BASE        e.g. http://127.0.0.1:8082/matomo
#   DB_HOST DB_NAME DB_USER DB_PASS
#   ADMIN_LOGIN ADMIN_PASS ADMIN_EMAIL
#   SITE_NAME SITE_URL TIMEZONE
set -euo pipefail

BASE="${MATOMO_BASE:?MATOMO_BASE is required}"
: "${DB_HOST:?}" "${DB_NAME:?}" "${DB_USER:?}" "${DB_PASS:?}"
: "${ADMIN_LOGIN:?}" "${ADMIN_PASS:?}" "${ADMIN_EMAIL:?}"
SITE_NAME="${SITE_NAME:-elomaiapp.com}"
SITE_URL="${SITE_URL:-https://elomaiapp.com/}"
TIMEZONE="${TIMEZONE:-Europe/Berlin}"

JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

post() {
  local url="$1"; shift
  curl -sS -c "$JAR" -b "$JAR" -o /tmp/matomo-step.html -w '%{http_code}' -X POST "$url" "$@"
}

check() {
  local code="$1" label="$2"
  if [[ "$code" =~ ^(200|302|303)$ ]]; then
    echo "  ok   $label ($code)"
  else
    echo "  FAIL $label ($code)" >&2
    grep -oE 'alert-danger[^<]*|Error[^<]{0,160}' /tmp/matomo-step.html | head -5 >&2
    exit 1
  fi
}

echo "Installing Matomo at $BASE"

# 1. Start a session.
code=$(curl -sS -c "$JAR" -b "$JAR" -o /dev/null -w '%{http_code}' "$BASE/index.php")
check "$code" "welcome"

# 2. Database configuration (writes config/config.ini.php).
code=$(post "$BASE/index.php?module=Installation&action=databaseSetup" \
  --data-urlencode "host=$DB_HOST" \
  --data-urlencode "username=$DB_USER" \
  --data-urlencode "password=$DB_PASS" \
  --data-urlencode "dbname=$DB_NAME" \
  --data-urlencode "tables_prefix=matomo_" \
  --data-urlencode 'adapter=PDO\MYSQL' \
  --data-urlencode "schema=Mariadb" \
  --data-urlencode "submit=Next")
check "$code" "database setup"

# 3. Create the tables (the step renders and installs the schema).
code=$(curl -sS -c "$JAR" -b "$JAR" -o /tmp/matomo-step.html -w '%{http_code}' \
  "$BASE/index.php?module=Installation&action=tablesCreation")
check "$code" "tables creation"

code=$(post "$BASE/index.php?module=Installation&action=tablesCreation" --data-urlencode "submit=Next")
check "$code" "tables creation confirmation"

# 4. Superuser.
code=$(post "$BASE/index.php?module=Installation&action=setupSuperUser" \
  --data-urlencode "login=$ADMIN_LOGIN" \
  --data-urlencode "password=$ADMIN_PASS" \
  --data-urlencode "password_bis=$ADMIN_PASS" \
  --data-urlencode "email=$ADMIN_EMAIL" \
  --data-urlencode "submit=Next")
check "$code" "superuser"

# 5. First website.
code=$(post "$BASE/index.php?module=Installation&action=firstWebsiteSetup" \
  --data-urlencode "siteName=$SITE_NAME" \
  --data-urlencode "url=$SITE_URL" \
  --data-urlencode "timezone=$TIMEZONE" \
  --data-urlencode "ecommerce=0" \
  --data-urlencode "submit=Next")
check "$code" "first website"

# 6. Finish. This step only clears `installation_in_progress` when the
#    default-settings form is actually submitted, so it must be a POST.
code=$(post "$BASE/index.php?module=Installation&action=finished" --data-urlencode "submit=Continue")
check "$code" "finished"

echo "Matomo installed."
