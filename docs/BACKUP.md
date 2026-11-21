# Production backup — 2026-11-21

Created on the VPS (`ai-vps`) before the first deployment of the new portfolio.

| Artifact | Purpose |
| --- | --- |
| `/root/backups/elomai-portfolio-latest-20261121T171400Z.tar.gz` | `docker save` of the image that was running in production (`elomai-portfolio:latest`, id `3f3b8e819372`, 26 MB compressed) |
| `/root/backups/docker-compose.yml.20261121T171300Z.bak` | The compose file before the image tag was changed |
| Image tag `elomai-portfolio:rollback-20260726` | The same image kept in the local Docker registry under an explicit name |

## Restore

```bash
# 1. point the compose service back at the preserved image
ssh ai-vps 'cd /root/infra && sed -i "s|image: elomai-portfolio:.*|image: elomai-portfolio:rollback-20260726|" docker-compose.yml'

# 2. recreate only the portfolio service
ssh ai-vps 'cd /root/infra && docker compose up -d --no-deps portfolio'

# 3. verify
curl -sS -o /dev/null -w "%{http_code}\n" https://elomaiapp.com/
```

If the image tag was lost entirely, reload it from the archive:

```bash
ssh ai-vps 'gunzip -c /root/backups/elomai-portfolio-latest-20261121T171400Z.tar.gz | docker load'
```

The original compose file can be restored with:

```bash
ssh ai-vps 'cp /root/backups/docker-compose.yml.20261121T171300Z.bak /root/infra/docker-compose.yml'
```
