# Deployment — elomaiapp.com

## Production architecture (verified 2026-11-21)

```
Internet
  └── Cloudflare (DNS + TLS edge)
        └── Nginx Proxy Manager  (container: npm, network: infra_proxy)
              │  proxy host #1: elomaiapp.com, www.elomaiapp.com
              │  forward: http://portfolio:80
              └── container: portfolio   (image elomai-portfolio:<tag>)
                    └── Nginx serving the Vite build at /usr/share/nginx/html
```

* Compose project: `infra` — file `/root/infra/docker-compose.yml` on the VPS (`ai-vps`, 76.13.155.15).
* Service/container name: `portfolio` (container_name `portfolio`), network `infra_proxy`.
* No host ports are published; the container is reachable only through NPM on the Docker network.
* TLS certificates and HSTS are terminated by NPM/Cloudflare; the container only serves HTTP on port 80.

## Build

```bash
cd portfolio
npm run typecheck        # tsc --noEmit
npm run build            # vite build -> dist/
docker build -t elomai-portfolio:<version> .
```

The Dockerfile installs with pnpm 10.18.0 and a frozen lockfile, builds with Vite and copies `dist/`
into `nginx:alpine` together with `nginx/default.conf`.

## Release procedure

1. Build the image locally with a unique tag, e.g. `elomai-portfolio:m24.1-20261121` (the tag running in production).
2. Ship it to the VPS and load it:
   ```bash
   docker save elomai-portfolio:<tag> | gzip | ssh ai-vps 'gunzip | docker load'
   ```
3. Point the compose service at the new tag in `/root/infra/docker-compose.yml`:
   ```yaml
   portfolio:
     image: elomai-portfolio:<tag>
     container_name: portfolio
     restart: unless-stopped
     networks:
       - proxy
   ```
4. Recreate only that service:
   ```bash
   ssh ai-vps 'cd /root/infra && docker compose up -d --no-deps portfolio'
   ```
5. Verify: container healthy, `https://elomaiapp.com/` returns 200 with the new build, then run the
   Playwright suite against production (`cd tests && npm run test:prod`).

## Rollback

The previous image is kept under an explicit tag, so a rollback needs one line and one recreate:

```bash
ssh ai-vps 'cd /root/infra && sed -i "s|image: elomai-portfolio:.*|image: elomai-portfolio:rollback-20260726|" docker-compose.yml && docker compose up -d --no-deps portfolio'
```

Artifacts created before the first upgrade (see `docs/BACKUP.md`):

* `/root/backups/elomai-portfolio-latest-<timestamp>.tar.gz` — the previously running image.
* `/root/backups/docker-compose.yml.<timestamp>.bak` — the compose file before the image tag change.

Nothing else on the VPS is touched: NPM, the `proxy`/`infra_proxy` network and all other containers
(OmniRoute, AKA IA, Afro-Haar, OctoBot, databases) stay as they are.

## Local preview

```bash
npm run dev       # http://127.0.0.1:5180
npm run preview   # http://127.0.0.1:4180 (built output)
```
