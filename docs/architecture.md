# Architecture & Design Decisions
 
## Overview
 
This is a small Express feedback API (create / list / get feedback + `/health`) built as **Project 2** of my cloud engineering sprint. The app itself is intentionally simple — the real goal of this project is to containerize it **the way it would be done in production**: a small, secure, self-checking image that anyone can run with one command.
 
```mermaid
flowchart LR
    subgraph Build["docker build (multi-stage)"]
        A[Stage 1: deps<br/>node:20-alpine<br/>npm ci --omit=dev] -->|copy only node_modules| B[Stage 2: runtime<br/>node:20-alpine<br/>USER node + HEALTHCHECK]
    end
    B --> C[(Image ~199 MB)]
    C -->|docker compose up| D[Container :3000<br/>status: healthy]
    E[.env file] -.->|env_file, never baked in| D
```
 
## Container design decisions
 
### Why a multi-stage build
 
I split the Dockerfile into a **deps stage** and a **runtime stage** so that installation leftovers (npm cache, lockfile metadata) never reach the final image — only the production `node_modules` and the source code are copied over. This keeps the image small and the attack surface low. It also plays well with layer caching: `package*.json` is copied before the code, so dependencies are only reinstalled when they actually change, and everyday code changes rebuild in seconds.
 
### Why the container runs as non-root
 
By default containers run as root, which means that if the app is ever compromised, the attacker is root *inside* the container — a much stronger starting point for escaping or doing damage. The official Node image ships with a built-in unprivileged `node` user, so I copy files with `--chown=node:node` and switch to `USER node`. Now the process has only the permissions it actually needs, which is the same least-privilege principle I applied to my IAM roles in Project 1.
 
### Why a HEALTHCHECK
 
A container can be "running" while the app inside it is actually dead — the process exists, but it stopped answering requests. The `HEALTHCHECK` instruction makes Docker call my `/health` endpoint every 30 seconds, so `docker ps` honestly reports `healthy` or `unhealthy` instead of just "Up". This is also what orchestrators and PaaS platforms use to decide whether to restart a container or route traffic to it — so the endpoint I wrote on day one of this project is doing real operational work.
 
### Supporting decisions
 
- **`.dockerignore`** keeps `node_modules`, `.git` and — most importantly — **`.env`** out of the build context, so secrets can never be baked into an image layer.
- **Configuration comes only from environment variables** (`--env-file` locally, injected by the platform in production). The image is environment-agnostic: the same image runs in dev and prod, only the config changes.
- **`docker-compose.yml`** documents how to run the app, so "works on my machine" becomes `docker compose up`.
## Result
 
Final image: `node:20-alpine`-based, multi-stage, non-root, healthchecked — **199 MB** (vs ~1 GB for a naive single-stage `node:20` build).
 
## Next step
 
CI pipeline (GitHub Actions): lint → test → build → **Trivy vulnerability scan** → push to GitHub Container Registry.