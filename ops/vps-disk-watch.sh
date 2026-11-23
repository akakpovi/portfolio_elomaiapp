#!/usr/bin/env bash
# vps-disk-watch.sh — read-only disk, inode and container-health monitor for the
# production VPS, written after the M10 mission found the root filesystem at 91 %
# (and at 100 % on 2026-11-23 03:42, before the daily vps-cleanup timer ran).
#
# What it does: measures, appends one JSON line, and raises a journald alert when
# a threshold is crossed. That is all.
#
# What it never does — by design, because this host shares one Docker daemon and
# one root filesystem with eight unrelated Compose projects:
#   * it never prunes, removes, stops or restarts anything, container or file;
#   * it never deletes a log, a volume, an image or a backup;
#   * it holds no credential and prints no secret.
# Monitoring-only is the point: an automatic cleaner that guesses wrong on this
# host deletes someone else's data.
#
# Usage:
#   vps-disk-watch.sh            measure, append one JSON line, alert if needed
#   vps-disk-watch.sh --status   print the latest measurement and 24 h trend
#
# Thresholds follow the M10 plan:
#   filesystem usage   warn 80 %   critical 90 %
#   inode usage        warn 80 %   critical 90 %
#   free space         warn 20 %   critical 10 %
#   unhealthy container        alert
#   24 h growth        warn 2 GiB
#
# Alerts go to journald (tag `vps-disk-watch`, priorities user.warning /
# user.crit), where they are visible to `journalctl -t vps-disk-watch` and to the
# existing ai-platform Sentinel. This script adds no notification channel and no
# network call, so there is nothing to authenticate and nothing to leak.

set -euo pipefail

STATE_DIR=${VPS_DISK_WATCH_DIR:-/var/log/vps-disk-watch}
STATUS_FILE="$STATE_DIR/status.jsonl"

# Thresholds are overridable from the environment only so the alert path can be
# exercised deliberately (WARN_FS=0 forces a warning); the installed unit sets
# none of them, so the production values below are the ones that apply.
WARN_FS=${WARN_FS:-80}
CRIT_FS=${CRIT_FS:-90}
WARN_INODE=${WARN_INODE:-80}
CRIT_INODE=${CRIT_INODE:-90}
WARN_FREE=${WARN_FREE:-20}
CRIT_FREE=${CRIT_FREE:-10}
WARN_GROWTH_BYTES=${WARN_GROWTH_BYTES:-$((2 * 1024 * 1024 * 1024))} # 2 GiB over 24 h

now_iso() { date -u +%Y-%m-%dT%H:%M:%SZ; }

alert() { # alert <priority> <message>
  logger -t vps-disk-watch -p "user.$1" -- "$2" || true
}

# --- measurements -----------------------------------------------------------

measure() {
  # One line for the root filesystem: total/used/available KiB and use percent.
  local fs_line
  fs_line=$(df -Pk / | awk 'NR==2 {print $2, $3, $4, $5}')
  read -r FS_TOTAL_KB FS_USED_KB FS_AVAIL_KB FS_PCT_RAW <<<"$fs_line"
  FS_PCT=${FS_PCT_RAW%\%}

  local ino_line
  ino_line=$(df -Pi / | awk 'NR==2 {print $2, $3, $5}')
  read -r INO_TOTAL INO_USED INO_PCT_RAW <<<"$ino_line"
  INO_PCT=${INO_PCT_RAW%\%}

  FS_FREE_PCT=$((100 - FS_PCT))

  # Containers: running, total, unhealthy, and their restart counts.
  CONTAINERS_RUNNING=$(docker ps -q | wc -l)
  CONTAINERS_TOTAL=$(docker ps -aq | wc -l)
  UNHEALTHY=$(docker ps --filter health=unhealthy --format '{{.Names}}' | paste -sd, -)
  UNHEALTHY_COUNT=0
  [ -n "$UNHEALTHY" ] && UNHEALTHY_COUNT=$(printf '%s' "$UNHEALTHY" | tr ',' '\n' | grep -c . || true)
  RESTARTS=$(docker ps -q | xargs -r docker inspect --format '{{.RestartCount}}' 2>/dev/null | awk '{s+=$1} END {print s+0}')

  # Docker storage, as the daemon reports it (strings such as "16.62GB").
  IMAGES_SIZE=$(docker system df --format '{{.Type}}|{{.Size}}' 2>/dev/null | awk -F'|' '$1=="Images"{print $2}')
  VOLUMES_SIZE=$(docker system df --format '{{.Type}}|{{.Size}}' 2>/dev/null | awk -F'|' '$1=="Local Volumes"{print $2}')
  VOLUMES_COUNT=$(docker volume ls -q | wc -l)

  JOURNAL_BYTES=$(journalctl --disk-usage 2>/dev/null | grep -oE '[0-9.]+[KMG]' | head -1)

  # Growth trend: first sample recorded in the last 24 h.
  PREV_FREE_KB=""
  PREV_TS=""
  if [ -s "$STATUS_FILE" ]; then
    PREV_LINE=$(awk -v cutoff="$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)" \
      -F'"free_kb":' '{split($2,a,","); free=a[1]} $0 ~ /"ts":"/ {match($0,/"ts":"[^"]+"/); ts=substr($0,RSTART+6,RLENGTH-7); if (ts >= cutoff && free != "") {print ts" "free; exit}}' "$STATUS_FILE" || true)
    if [ -n "${PREV_LINE:-}" ]; then
      PREV_TS=${PREV_LINE% *}
      PREV_FREE_KB=${PREV_LINE#* }
    fi
  fi
}

# --- reporting --------------------------------------------------------------

emit() {
  mkdir -p "$STATE_DIR"
  chmod 750 "$STATE_DIR" 2>/dev/null || true
  local line
  line=$(printf '{"ts":"%s","fs_total_kb":%s,"fs_used_kb":%s,"fs_avail_kb":%s,"fs_pct":%s,"inode_pct":%s,"containers_running":%s,"containers_total":%s,"unhealthy":"%s","restarts":%s,"images_size":"%s","volumes_size":"%s","volumes_count":%s,"journal":"%s"}' \
    "$(now_iso)" "$FS_TOTAL_KB" "$FS_USED_KB" "$FS_AVAIL_KB" "$FS_PCT" "$INO_PCT" \
    "$CONTAINERS_RUNNING" "$CONTAINERS_TOTAL" "$UNHEALTHY" "$RESTARTS" \
    "$IMAGES_SIZE" "$VOLUMES_SIZE" "$VOLUMES_COUNT" "$JOURNAL_BYTES")
  printf '%s\n' "$line" >>"$STATUS_FILE"
  chmod 640 "$STATUS_FILE" 2>/dev/null || true
}

check() {
  local hit=0
  if [ "$FS_PCT" -ge "$CRIT_FS" ]; then
    alert crit "root filesystem at ${FS_PCT}% (critical ${CRIT_FS}%), ${FS_AVAIL_KB} KiB free"
    hit=1
  elif [ "$FS_PCT" -ge "$WARN_FS" ]; then
    alert warning "root filesystem at ${FS_PCT}% (warning ${WARN_FS}%), ${FS_AVAIL_KB} KiB free"
    hit=1
  fi
  if [ "$FS_FREE_PCT" -le "$CRIT_FREE" ]; then
    alert crit "free space ${FS_FREE_PCT}% (critical floor ${CRIT_FREE}%)"
    hit=1
  elif [ "$FS_FREE_PCT" -le "$WARN_FREE" ]; then
    alert warning "free space ${FS_FREE_PCT}% (warning floor ${WARN_FREE}%)"
    hit=1
  fi
  if [ "$INO_PCT" -ge "$CRIT_INODE" ]; then
    alert crit "inodes at ${INO_PCT}% (critical ${CRIT_INODE}%)"
    hit=1
  elif [ "$INO_PCT" -ge "$WARN_INODE" ]; then
    alert warning "inodes at ${INO_PCT}% (warning ${WARN_INODE}%)"
    hit=1
  fi
  if [ "$UNHEALTHY_COUNT" -gt 0 ]; then
    alert err "container(s) unhealthy: ${UNHEALTHY}"
    hit=1
  fi
  if [ -n "$PREV_FREE_KB" ] && [ "$PREV_FREE_KB" -gt "$FS_AVAIL_KB" ]; then
    local consumed=$((PREV_FREE_KB - FS_AVAIL_KB))
    if [ "$consumed" -ge "$WARN_GROWTH_BYTES" ] 2>/dev/null; then
      alert warning "free space fell by $((consumed / 1048576)) MiB since ${PREV_TS} (threshold $((WARN_GROWTH_BYTES / 1073741824)) GiB/24h)"
      hit=1
    fi
  fi
  return 0
}

show_status() {
  if [ ! -s "$STATUS_FILE" ]; then
    echo "no measurement yet ($STATUS_FILE is empty)"
    return 0
  fi
  tail -1 "$STATUS_FILE" | sed 's/","/"\n"/g; s/^{//; s/}$//'
  echo
  echo "--- 24 h trend (oldest sample in window) ---"
  [ -n "$PREV_FREE_KB" ] && echo "since $PREV_TS : free was $((PREV_FREE_KB / 1024)) MiB, now $((FS_AVAIL_KB / 1024)) MiB"
}

main() {
  case "${1:-}" in
    --status)
      measure
      show_status
      ;;
    "" )
      measure
      emit
      check
      printf 'fs %s%% free %s%% inodes %s%% containers %s/%s unhealthy %s\n' \
        "$FS_PCT" "$FS_FREE_PCT" "$INO_PCT" "$CONTAINERS_RUNNING" "$CONTAINERS_TOTAL" "$UNHEALTHY_COUNT"
      ;;
    *)
      echo "usage: $0 [--status]" >&2
      exit 2
      ;;
  esac
}

main "$@"
