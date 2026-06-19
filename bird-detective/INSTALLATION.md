# Garden Birds — Installation Guide

A real-time garden bird detection dashboard powered by [BirdNET-Go](https://github.com/tphakala/birdnet-go).

Displays live detections, rarity scoring, species facts, audio playback and an admin panel — all in a clean, nature-inspired interface.

---

## Requirements

- **BirdNET-Go** running and accessible on your network
- **Docker** and **Docker Compose** installed on the host machine
- A modern web browser

Optional:
- A Cloudflare account (for public access via tunnel)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/garden-birds.git
cd garden-birds
```

### 2. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Configure environment

Copy the example env file and edit it:

```bash
cp .env.example .env
nano .env
```

Key settings in `.env`:

```env
# Your BirdNET-Go instance
BIRDNET_URL=http://192.168.1.70:8080

# Admin panel login
ADMIN_USER=admin
ADMIN_PASS=changeme

# Optional: Cloudflare WAF secret (see Security section)
BIRD_SECRET=
```

### 4. Build and run

```bash
docker-compose up -d
```

The site will be available at **http://localhost:8080**

Check that it is working:

```bash
docker-compose logs --tail=20 backend
```

You should see:
```
Bird Detective HQ Backend running on port 3001
Polling BirdNET-Go at http://192.168.1.70:8080
10 species | 3 rare | 1 legendary
```

---

## Admin Panel

Visit `http://localhost:8080/admin`

Log in with your `ADMIN_USER` / `ADMIN_PASS` credentials.

From the admin panel you can:

| Setting | Description |
|---------|-------------|
| **Site Title** | Change the name displayed in the header (e.g. "Ruairí's Garden") |
| **BirdNET-Go URL** | Update the URL of your BirdNET-Go instance |
| **Ticker Facts** | Add, edit or remove the rotating "Did you know?" facts |
| **Bird Facts** | Add species-specific facts shown on individual bird cards |

> **Note:** Changing the BirdNET-Go URL requires a backend container restart:
> ```bash
> docker-compose restart backend
> ```

---

## Docker Compose Structure

```
garden-birds/
├── backend/          # Node.js API server
│   ├── server.js     # Main server
│   ├── settings.js   # Persistent settings store
│   └── Dockerfile
├── frontend/         # React + Vite + Tailwind
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── INSTALLATION.md
```

Two containers are started:

| Container | Port | Purpose |
|-----------|------|---------|
| `bird-detective-backend`  | 3001 | API server, polls BirdNET-Go |
| `bird-detective-frontend` | 8080 | Nginx serving the React app |

---

## Updating

```bash
git pull
cd backend && npm install && cd ..
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Public Access with Cloudflare Tunnel

### 1. Install cloudflared

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
dpkg -i cloudflared.deb
```

### 2. Authenticate and create tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create garden-birds
```

### 3. Configure

Edit `/etc/cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: birds.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

### 4. Add DNS and start service

```bash
cloudflared tunnel route dns garden-birds birds.yourdomain.com
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
```

---

## Protecting BirdNET-Go with Cloudflare WAF

If you expose BirdNET-Go via Cloudflare, restrict access to only your backend:

1. Add a second hostname in cloudflared config:
   ```yaml
   - hostname: birdnet.yourdomain.com
     service: http://192.168.1.70:8080
   ```

2. Create a WAF custom rule in the Cloudflare dashboard:
   - **Expression:** `(http.host eq "birdnet.yourdomain.com") and (all(http.request.headers["x-bird-secret"][*] ne "YOUR_SECRET"))`
   - **Action:** Block

3. Add to `.env`:
   ```env
   BIRD_SECRET=your_random_secret_here
   ```

The backend sends this header automatically with every BirdNET-Go request.

---

## DNS Issues on Proxmox LXC

If running inside a Proxmox LXC container and DNS fails inside Docker:

From the **Proxmox host**:
```bash
pct set <LXC_ID> --nameserver "1.1.1.1 8.8.8.8"
```

Inside the LXC, add Docker daemon DNS:
```bash
mkdir -p /etc/docker
printf '{"dns":["1.1.1.1","8.8.8.8"]}\n' > /etc/docker/daemon.json
systemctl restart docker
```

---

## BirdNET-Go API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v2/analytics/species/daily` | Daily species list |
| `GET /api/v2/detections?queryType=species&...` | Individual detections |
| `GET /api/v2/media/image/:scientificName` | Species thumbnails |
| `GET /api/v2/audio/:id` | Detection audio |

---

## Rarity Scores

| Label | Score | Display |
|-------|-------|---------|
| COMMON | 0-19 | Green dot |
| OCCASIONAL | 20-39 | Blue circle |
| UNCOMMON | 40-59 | Purple diamond |
| RARE | 60-79 | Orange diamond |
| LEGENDARY | 80-100 | Gold star |

---

## Troubleshooting

**"Connection issue" banner**
```bash
docker-compose logs --tail=30 backend
```

**Images blocked by browser (CORS / Private Network Access)**
Images must be proxied through `/api/thumbnail/`. Check that `thumbnailUrl` values in the API start with `/api/thumbnail/` not a local IP address.

**Backend shows "Using demo data"**
The backend cannot reach BirdNET-Go. Verify:
```bash
curl http://192.168.1.70:8080/api/v2/analytics/species/daily | head -c 100
docker exec bird-detective-backend nslookup google.com
```

**Permission denied running npm install**
```bash
sudo chown -R $USER:$USER /opt/garden-birds
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Containers | Docker, Docker Compose |
| Proxy | Nginx |
| AI Detection | BirdNET-Go (external, required) |

---

*Built for Ruairí — a junior bird explorer*
