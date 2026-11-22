#!/usr/bin/env bash
# Post-install configuration for Matomo.
#
# Creates two application tokens (admin for one-off setup, a view-only token
# for the WordPress dashboard), sets privacy defaults and defines the
# conversion goals used by the portfolio tracking.
#
# Tokens are written to files with mode 600 and never printed.
set -euo pipefail

BASE="${MATOMO_BASE:?MATOMO_BASE required}"          # e.g. http://127.0.0.1:8082/matomo
DB_CONTAINER="${DB_CONTAINER:?DB_CONTAINER required}" # mariadb container name
DB_ROOT_PASS="${DB_ROOT_PASS:?DB_ROOT_PASS required}"
TOKEN_DIR="${TOKEN_DIR:?TOKEN_DIR required}"          # directory for token files
SALT="${MATOMO_SALT:?MATOMO_SALT required}"
SITE_ID="${SITE_ID:-1}"
VIEW_USER="${VIEW_USER:-wordpress}"
VIEW_USER_PASS="${VIEW_USER_PASS:?VIEW_USER_PASS required}"
VIEW_USER_EMAIL="${VIEW_USER_EMAIL:-analytics-dashboard@elomaiapp.com}"

mkdir -p "$TOKEN_DIR"
chmod 700 "$TOKEN_DIR"

sql() { docker exec -i "$DB_CONTAINER" mariadb -uroot -p"$DB_ROOT_PASS" matomo "$@" 2>/dev/null; }

gen() { head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

insert_token() {
  local login="$1" description="$2" token="$3"
  local hash
  hash=$(printf '%s%s' "$token" "$SALT" | sha512sum | awk '{print $1}')
  sql -e "DELETE FROM matomo_user_token_auth WHERE login='${login}' AND description='${description}';
          INSERT INTO matomo_user_token_auth (login, description, password, hash_algo, system_token, date_created, secure_only)
          VALUES ('${login}', '${description}', '${hash}', 'sha512', 0, NOW(), 0);"
}

# --- admin token (setup only) ------------------------------------------------
if [[ -f "$TOKEN_DIR/admin.token" ]]; then
  ADMIN_TOKEN=$(cat "$TOKEN_DIR/admin.token")
else
  ADMIN_TOKEN=$(gen)
  printf '%s' "$ADMIN_TOKEN" > "$TOKEN_DIR/admin.token"
  chmod 600 "$TOKEN_DIR/admin.token"
fi
insert_token admin "elomai-setup" "$ADMIN_TOKEN"

api() {
  local method="$1"; shift
  curl -sS -X POST "$BASE/index.php?module=API&method=$method&format=json&idSite=$SITE_ID" \
    --data-urlencode "token_auth=$ADMIN_TOKEN" "$@"
}

# --- reporting user with view-only access ------------------------------------
api UsersManager.getUser --data-urlencode "userLogin=$VIEW_USER" | grep -q '"login"' || \
  api UsersManager.addUser \
    --data-urlencode "userLogin=$VIEW_USER" \
    --data-urlencode "password=$VIEW_USER_PASS" \
    --data-urlencode "email=$VIEW_USER_EMAIL" | tee /tmp/adduser.json > /dev/null
if grep -q '"result":"error"' /tmp/adduser.json 2>/dev/null; then
  echo "  warn: creating the reporting user failed: $(cat /tmp/adduser.json)" >&2
fi

api UsersManager.setUserAccess \
  --data-urlencode "userLogin=$VIEW_USER" \
  --data-urlencode "access=view" \
  --data-urlencode "idSites=$SITE_ID" > /dev/null

if [[ -f "$TOKEN_DIR/reporting.token" ]]; then
  REPORTING_TOKEN=$(cat "$TOKEN_DIR/reporting.token")
else
  REPORTING_TOKEN=$(gen)
  printf '%s' "$REPORTING_TOKEN" > "$TOKEN_DIR/reporting.token"
  chmod 600 "$TOKEN_DIR/reporting.token"
fi
insert_token "$VIEW_USER" "elomai-editorial-dashboard" "$REPORTING_TOKEN"

# --- privacy ---------------------------------------------------------------
# Anonymise the last two bytes of the visitor IP, force cookieless tracking
# server-side (so no identifier can be stored even if a client misbehaves),
# and drop raw analytics data after 180 days — matching the published notice.
api "PrivacyManager.setAnonymizeIpSettings" \
  --data-urlencode "anonymizeIPEnable=1" \
  --data-urlencode "ipAddressMaskLength=2" \
  --data-urlencode "useAnonymizedIpForVisitEnrichment=0" \
  --data-urlencode "anonymizeUserId=1" \
  --data-urlencode "anonymizeOrderId=0" \
  --data-urlencode "forceCookielessTracking=1" > /dev/null || true

api "PrivacyManager.setDeleteLogsSettings" \
  --data-urlencode "enableDeleteLogs=1" \
  --data-urlencode "deleteLogsOlderThan=180" > /dev/null || true

api "PrivacyManager.activateDoNotTrack" > /dev/null || true

# --- conversion goals (event based) ----------------------------------------
add_goal() {
  local name="$1" action="$2"
  api "Goals.getGoals" | grep -q "\"$name\"" && return 0
  api "Goals.addGoal" \
    --data-urlencode "name=$name" \
    --data-urlencode "description=Automatisch aus dem Portfolio-Tracking" \
    --data-urlencode "matchAttribute=event_action" \
    --data-urlencode "pattern=$action" \
    --data-urlencode "patternType=exact" \
    --data-urlencode "caseSensitive=0" \
    --data-urlencode "allowMultipleConversionsPerVisit=1" > /dev/null || true
}

add_goal "Freelancer profile click" "freelancer_profile_click"
add_goal "Contact CTA click" "contact_click"
add_goal "Email click" "email_click"
add_goal "Project engagement" "project_open"
add_goal "Article shared" "article_share"
add_goal "Social share click" "social_share_click"

echo "Matomo configured."
echo "  reporting token file: $TOKEN_DIR/reporting.token"
echo "  goals: $(api Goals.getGoals | grep -o '"name"' | wc -l | tr -d ' ')"
echo "  privacy: $(api PrivacyManager.getAnonymisationSettings | head -c 220)"
