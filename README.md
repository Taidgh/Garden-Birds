# 🐦 Garden Birds

> A child-friendly frontend for [BirdNET-Go](https://github.com/tphakala/birdnet-go)

Garden Birds is a more visual, accessible interface for BirdNET-Go — designed to make real-time bird detection fun and easy to understand for kids and families.

In this setup, a **Raspberry Pi 3A+ with a USB webcam** provides a continuous audio stream over the local network. Both **BirdNET-Go** and the **Garden Birds dashboard** run as separate LXC containers on a single **Proxmox** machine, with BirdNET-Go consuming the Pi's audio stream and Garden Birds reading from the BirdNET-Go API.

You could equally run BirdNET-Go directly on a remote **Raspberry Pi 4 or 5** (with a microphone attached) and host the Garden Birds frontend locally or on a separate machine — the two services just need to be able to reach each other over your network.

![Garden Birds Screenshot](https://raw.githubusercontent.com/birdnet-team/BirdNET-Analyzer-Sierra/refs/heads/main/gui/img/birdnet_logo.png)

---

## Features

- **Live detections** — real-time feed of birds detected in the last 12 hours
- **Rarity scoring** — COMMON → OCCASIONAL → UNCOMMON → RARE → LEGENDARY
- **Species cards** — image, confidence, fun facts, audio playback
- **All Species page** — every bird ever detected, searchable and filterable
- **Bird of the Day** — automatically chosen from rarest detections
- **Admin panel** — change title, facts, BirdNET-Go URL, birthday popup
- **Birthday popup** — configure a date-specific celebration message
- **Cloudflare tunnel** ready — works great behind a public subdomain

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, DM Sans |
| Backend | Node.js, Express |
| Containers | Docker, Docker Compose |
| Proxy | Nginx |
| AI Detection | BirdNET-Go (external, required) |

---

## Full Installation Guide

### Step 1 — Install Proxmox VE

Download and install [Proxmox VE](https://www.proxmox.com/en/downloads) on a PC, mini PC, or server.
A Raspberry Pi or Intel NUC works well. Minimum specs: 4GB RAM, 32GB storage.

---

### Step 2 — Install BirdNET-Go on Proxmox

BirdNET-Go is the AI engine that listens to your microphone and identifies birds.
Install it as an LXC container using the community script.

**In the Proxmox web UI → Shell (top right), run:**

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/birdnet-go.sh)"
```

Follow the prompts. The script will:
- Create a Debian LXC container
- Install BirdNET-Go and all dependencies
- Start the service automatically

Once installed, find the LXC's IP address:

```bash
# In the Proxmox shell
ip a   # or check the LXC summary in the web UI
```

Open BirdNET-Go in your browser: `http://<BIRDNET_IP>:8080`

**Configure BirdNET-Go:**
1. Go to **Settings → Audio** — select your microphone input
2. Go to **Settings → Location** — set your coordinates for local species filtering
3. Go to **Settings → Analysis** — enable realtime detection

> **Note:** The script page with full details is at:
> https://community-scripts.org/scripts/birdnet-go

---

### Step 3 — Install Garden Birds on Proxmox

Create a second LXC for the Garden Birds dashboard.

**In the Proxmox shell:**

```bash
# Create a Debian 12 LXC (adjust storage and ID as needed)
pct create 102 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname garden-birds \
  --memory 512 \
  --cores 2 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --storage local-lvm \
  --rootfs local-lvm:8 \
  --unprivileged 1 \
  --features nesting=1

pct start 102
pct enter 102
```

**Inside the LXC:**

```bash
# Install Docker
apt update && apt install -y curl git
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install -y docker-compose

# Clone the repo
cd /opt
git clone https://github.com/YOUR_USERNAME/garden-birds.git
cd garden-birds

# Install backend dependencies
cd backend && npm install && cd ..

# Configure
cp .env.example .env
nano .env
```

Edit `.env`:

```env
BIRDNET_URL=http://192.168.1.70:8080   # Replace with your BirdNET-Go LXC IP
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
```

```bash
# Build and start
docker-compose up -d

# Check it's running
docker-compose logs --tail=20 backend
```

Visit `http://<GARDEN_BIRDS_IP>:8080` in your browser.

---

### Step 4 — Set Up Cloudflare Tunnel (Public Access)

This lets you access your dashboard from anywhere using a custom domain, with no port forwarding needed.

#### Prerequisites
- A domain name added to Cloudflare (free plan works)
- A Cloudflare account at [dash.cloudflare.com](https://dash.cloudflare.com)

#### Install cloudflared inside the Garden Birds LXC

```bash
# Download cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
dpkg -i cloudflared.deb

# Authenticate (opens a browser link — copy/paste it)
cloudflared tunnel login

# Create the tunnel
cloudflared tunnel create garden-birds

# Note the Tunnel ID shown — you'll need it below
cloudflared tunnel list
```

#### Configure the tunnel

```bash
mkdir -p /etc/cloudflared
nano /etc/cloudflared/config.yml
```

```yaml
tunnel: YOUR_TUNNEL_ID_HERE
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID_HERE.json

ingress:
  - hostname: birds.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

#### Add DNS record and run as a service

```bash
# Create the DNS record automatically
cloudflared tunnel route dns garden-birds birds.yourdomain.com

# Install as a system service
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared

# Verify it's connected
systemctl status cloudflared
```

Your dashboard is now live at `https://birds.yourdomain.com` 🎉

---

### Step 5 — Admin Panel

Visit `https://birds.yourdomain.com/admin`

Log in with your `ADMIN_USER` / `ADMIN_PASS` from `.env`.

| Setting | What it does |
|---------|-------------|
| **Site Title** | Change the header name (e.g. "My Garden Birds") |
| **BirdNET-Go URL** | Update if your BirdNET-Go IP changes |
| **Birthday Popup** | Set a date, message and image for a celebration popup |
| **Ticker Facts** | Edit the rotating "Did you know?" facts |
| **Bird Facts** | Add species-specific facts to individual bird cards |

---

### Step 6 — (Optional) Protect BirdNET-Go with Cloudflare WAF

If you also want to expose BirdNET-Go publicly but restrict access to only your dashboard:

**1. Add BirdNET-Go as a second tunnel hostname**

On the BirdNET-Go machine (or same machine if combined), install cloudflared and add:

```yaml
ingress:
  - hostname: birds.yourdomain.com
    service: http://localhost:8080

  - hostname: birdnet.yourdomain.com
    service: http://192.168.1.70:8080

  - service: http_status:404
```

**2. Generate a secret**

```bash
openssl rand -hex 32
# Copy the output — this is YOUR_SECRET
```

**3. Add a Cloudflare WAF rule**

In Cloudflare dashboard → your domain → **Security → WAF → Custom Rules → Create rule**:

- Name: `Block unauthenticated BirdNET access`
- Expression: `(http.host eq "birdnet.yourdomain.com") and (all(http.request.headers["x-bird-secret"][*] ne "YOUR_SECRET"))`
- Action: **Block**

**4. Add the secret to your `.env`**

```bash
nano /opt/garden-birds/.env
# Add:
BIRD_SECRET=YOUR_SECRET

# Restart backend
cd /opt/garden-birds && docker-compose restart backend
```

The backend will now automatically send this secret header with every BirdNET-Go request.

---

## Updating

```bash
cd /opt/garden-birds
git pull
cd backend && npm install && cd ..
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Troubleshooting

### Dashboard shows "Connection issue"
```bash
cd /opt/garden-birds
docker-compose logs --tail=30 backend
```

### Backend shows "Using demo data"
BirdNET-Go is unreachable. Check:
```bash
# From inside the Garden Birds LXC
curl http://192.168.1.70:8080/api/v2/analytics/species/daily | head -c 100

# Check Docker DNS works
docker exec bird-detective-backend nslookup google.com
```

If DNS fails inside Docker on Proxmox LXC:
```bash
mkdir -p /etc/docker
echo '{"dns":["1.1.1.1","8.8.8.8"]}' > /etc/docker/daemon.json
systemctl restart docker
cd /opt/garden-birds && docker-compose up -d
```

### Bird images blocked by browser
All images are proxied through `/api/thumbnail/` — the browser never connects directly to BirdNET-Go. If you see CORS errors, ensure the backend `BIRDNET_URL` env var is set correctly and the backend rebuilt with `docker-compose build --no-cache backend`.

### Permission denied running npm install
```bash
sudo chown -R $USER:$USER /opt/garden-birds
```

### LXC has no internet access
From the **Proxmox host** shell:
```bash
# Find your LXC ID
pct list

# Set DNS
pct set 102 --nameserver "1.1.1.1 8.8.8.8"

# Check networking
pct config 102 | grep net
```

---

## BirdNET-Go API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v2/analytics/species/daily` | Today's species detections |
| `GET /api/v2/analytics/species/summary` | All-time species archive |
| `GET /api/v2/detections?queryType=species&...` | Individual detection records |
| `GET /api/v2/media/image/:scientificName` | Species thumbnail images |
| `GET /api/v2/audio/:id` | Detection audio recordings |

---

## Rarity System

Scores 0–100 based on species baseline rarity, daily detection count, new species bonus, and confidence:

| Label | Score | Card display |
|-------|-------|-------------|
| COMMON | 0–19 | Green · |
| OCCASIONAL | 20–39 | Blue ◉ |
| UNCOMMON | 40–59 | Purple ◈ |
| RARE | 60–79 | Orange ◆ |
| LEGENDARY | 80–100 | Gold ★ |

---

## Project Structure

```
garden-birds/
├── backend/
│   ├── server.js      # Express API — polls BirdNET-Go, serves all /api routes
│   ├── settings.js    # Persistent JSON settings store
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx              # Routes: /, /species, /admin
│   │   └── components/
│   │       ├── AllSpeciesPage.jsx
│   │       ├── AdminPage.jsx
│   │       ├── BirdCard.jsx
│   │       ├── BirdDetailModal.jsx
│   │       ├── BirthdayPopup.jsx
│   │       ├── CoolFactsTicker.jsx
│   │       ├── HeroSection.jsx
│   │       ├── LiveFeed.jsx
│   │       ├── NewBirdAlert.jsx
│   │       └── StatsDashboard.jsx
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

*Built for junior bird explorers everywhere 🐦*
# Garden-Birds
