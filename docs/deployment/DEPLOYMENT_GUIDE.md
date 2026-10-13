# BikeHub Production Deployment Guide

This guide provides end-to-end instructions for deploying **BikeHub – An Online Platform for Buying and Selling Bikes** across multiple hosting environments: Docker Compose (Local/VPS), Cloud PaaS (Render + Vercel + Aiven), and Self-Hosted Cloud VM (AWS EC2 / DigitalOcean).

---

## 1. System Architecture & Topology

```
                  [ HTTPS Internet Traffic (Port 80/443) ]
                                     |
                                     v
                       +---------------------------+
                       |   Nginx Reverse Proxy     |
                       | (frontend container / CDN)|
                       +-------------+-------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
             v                                               v
    [ Static React SPA ]                            [ Spring Boot REST API ]
    (HTML5, CSS3, JS)                                (Java 17, Port 8080)
                                                             |
                                      +----------------------+----------------------+
                                      |                                             |
                                      v                                             v
                           [ MySQL 8.0 Database ]                        [ Flask AI Microservice ]
                           (Port 3306, ACID Escrow)                      (Python 3.10, Port 5000)
```

---

## 2. Option A: 1-Command Docker Compose Deployment (Recommended)

Docker Compose provisions and connects all 4 tiers simultaneously with zero external dependencies required on the host system (except Docker & Docker Compose).

### Prerequisites
* Docker Engine 24.0+
* Docker Compose v2.20+

### Step-by-Step Launch
1. **Clone or Navigate to the Workspace Directory**:
   ```bash
   cd c:/Users/Kalle/Downloads/BikeHub/BikeHub
   ```

2. **Verify Configuration**:
   The root `docker-compose.yml` mounts:
   * `./database/schema.sql` &rarr; automatically executes DDL, tables, constraints, and seed data into MySQL 8.0 on first startup.
   * `mysql_data` &rarr; persistent named volume preserving transactions.
   * `bikehub_uploads` &rarr; persistent volume storing uploaded vehicle photographs.

3. **Build and Launch All Containers**:
   ```bash
   docker compose up --build -d
   ```

4. **Verify Container Health & Logs**:
   ```bash
   docker compose ps
   ```
   *Expected Output*:
   | Service Name | Container Name | Port Mappings | Status |
   | :--- | :--- | :--- | :--- |
   | `mysql-db` | `bikehub-mysql` | `0.0.0.0:3306->3306/tcp` | Up (healthy) |
   | `bikehub-ai` | `bikehub-ai` | `0.0.0.0:5000->5000/tcp` | Up (healthy) |
   | `backend` | `bikehub-backend` | `0.0.0.0:8080->8080/tcp` | Up (healthy) |
   | `frontend` | `bikehub-frontend`| `0.0.0.0:80->80/tcp, 5173->80/tcp` | Up |

5. **Access Application**:
   * **Web Application UI**: `http://localhost` (or `http://localhost:5173`)
   * **Spring Boot REST APIs**: `http://localhost:8080/api`
   * **Swagger OpenAPI Docs**: `http://localhost:8080/swagger-ui.html`
   * **AI Microservice**: `http://localhost:5000/health`

6. **Shutting Down**:
   ```bash
   docker compose down          # Keeps database data intact
   docker compose down -v       # Removes containers AND resets database volume
   ```

---

## 3. Option B: Cloud PaaS Deployment (Free / Low Cost Tier)

Deploy each tier to purpose-built cloud providers with automatic CI/CD git pushes.

### Tier 1: Cloud MySQL Database (Aiven / Railway / PlanetScale)
1. Create a free MySQL 8 service on [Aiven.io](https://aiven.io) or [Railway.app](https://railway.app).
2. Note your connection URI, e.g.:
   `mysql://avnadmin:PASSWORD@mysql-bikehub.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED`
3. Connect via MySQL Workbench or command line and run the initialization script:
   ```bash
   mysql -h mysql-bikehub.aivencloud.com -P 12345 -u avnadmin -p defaultdb < database/schema.sql
   ```

### Tier 2: AI Microservice (Render / Railway)
1. Push repository to GitHub.
2. In [Render.com](https://render.com), click **New Web Service** &rarr; select repository.
3. Configure settings:
   * **Root Directory**: `ai-service`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 2 app:app`
4. Copy the deployed URL (e.g. `https://bikehub-ai.onrender.com`).

### Tier 3: Spring Boot 3 Backend (Render / Railway / Fly.io)
1. In [Render.com](https://render.com), click **New Web Service** &rarr; select repository.
2. Configure settings:
   * **Root Directory**: `backend`
   * **Environment**: `Docker` (Render automatically uses `backend/Dockerfile`)
3. Add Environment Variables:
   | Variable | Value |
   | :--- | :--- |
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `SPRING_DATASOURCE_URL` | `jdbc:mysql://<AIVEN_HOST>:<PORT>/defaultdb?sslMode=REQUIRED` |
   | `SPRING_DATASOURCE_USERNAME` | `<AIVEN_USER>` |
   | `SPRING_DATASOURCE_PASSWORD` | `<AIVEN_PASSWORD>` |
   | `AI_SERVICE_URL` | `https://bikehub-ai.onrender.com` |
   | `JWT_SECRET` | `BikeHubSuperSecretSecurityKey2026WithAtLeast256BitsLength!` |
   | `CORS_ALLOWED_ORIGINS` | `https://bikehub.vercel.app` |
4. Deploy and note your public backend URL (e.g. `https://bikehub-api.onrender.com`).

### Tier 4: React.js Frontend (Vercel / Netlify)
1. In [Vercel.com](https://vercel.com), click **Add New Project** &rarr; import repository.
2. Configure settings:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Add Environment Variable:
   * `VITE_API_URL` = `https://bikehub-api.onrender.com`
4. Add `vercel.json` in `frontend/` to rewrite all routes to `index.html`:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://bikehub-api.onrender.com/api/$1" },
       { "source": "/uploads/(.*)", "destination": "https://bikehub-api.onrender.com/uploads/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
5. Click **Deploy**.

---

## 4. Option C: Ubuntu Linux VPS / AWS EC2 Deployment

### 1. Initial Host Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Configure Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Deploy Stack with Docker Compose
```bash
git clone https://github.com/your-username/BikeHub.git
cd BikeHub
docker compose -f docker-compose.yml up -d --build
```

### 4. Enable HTTPS / SSL with Certbot
Install Certbot for automated Let's Encrypt certificate renewal:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 5. Security & Maintenance Operations

### Automated Database Backups
Create a cron job on the host machine to back up the MySQL database daily:
```bash
# Add to crontab via `crontab -e`
0 2 * * * docker exec bikehub-mysql mysqldump -u root -proot bikehub_db | gzip > /backups/bikehub_$(date +\%F).sql.gz
```

### Database Restoration
```bash
gunzip < /backups/bikehub_2026-10-12.sql.gz | docker exec -i bikehub-mysql mysql -u root -proot bikehub_db
```

### Health Monitoring Endpoints
* **Backend Health**: `GET http://localhost:8080/api/bikes?page=0&size=1`
* **AI Service Health**: `GET http://localhost:5000/health` &rarr; `{"status": "healthy"}`
* **Nginx HTTP Probe**: `GET http://localhost/` &rarr; HTTP 200 OK
