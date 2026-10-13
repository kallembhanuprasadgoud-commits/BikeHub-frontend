# BikeHub – Online Platform for Buying & Selling Bikes

[![Spring Boot 3.3.4](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java 17](https://img.shields.io/badge/Java-17-blue.svg)](https://openjdk.org/projects/jdk/17/)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-46%20Passed-success.svg)](backend)
[![Docker](https://img.shields.io/badge/Docker-Multi--Container-2496ED.svg)](docker-compose.yml)

A production-grade, full-stack two-wheeler marketplace where verified sellers list motorcycles, and buyers search, compare, chat in real-time, review, and complete escrow-protected purchases. Administrators verify dealerships, moderate content, and monitor analytics.

---

## 1. System Architecture & Tech Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Axios (JWT interceptors), Context API, Recharts, SockJS + STOMP client, React Hot Toast |
| **Backend** | Java 17, Spring Boot 3.3.4, Spring Security 6 + JJWT 0.12.6, Spring Data JPA / Hibernate, Spring WebSocket (STOMP), OpenAPI 3 (Swagger) |
| **Database** | MySQL 8.0 (3NF normalized relational schema, indexes, foreign key constraints, ACID escrow transactions) |
| **AI / ML** | Python 3.10 Flask microservice (port 5000) with native Java multi-factor linear regression fallback |
| **Payments** | Razorpay test-mode escrow gateway (tokenized order generation & HMAC-SHA256 signature verification) |
| **DevOps** | Multi-stage Dockerfiles, Docker Compose, Nginx reverse proxy, automated shell smoke verification suites |

---

## 2. Project Directory Structure

```
BikeHub/
├── backend/                  # Spring Boot 3 REST API + STOMP WebSockets
│   ├── src/main/java/        # Entities, DTOs, Controllers, Services, Repositories, Security
│   ├── src/test/java/        # 46 Unit & MockMvc Integration Test Suites
│   ├── Dockerfile            # Multi-stage OpenJDK 17 production container
│   └── pom.xml
├── frontend/                 # React.js (Vite) Single Page Application
│   ├── src/pages/            # Marketplace, Buyer, Seller, and Admin Views
│   ├── src/components/       # UI Components (BikeCard, Navbar, Footer, StarRating)
│   ├── src/context/          # AuthContext, SocketContext, NotificationContext
│   ├── src/services/         # Axios API clients for all backend endpoints
│   ├── nginx.conf            # Reverse proxy configuration for SPA + REST + WS
│   └── Dockerfile            # Multi-stage Node.js build with Nginx runner
├── ai-service/               # Python Flask AI Microservice (Port 5000)
│   ├── app.py                # Price estimation & image condition analysis endpoints
│   └── Dockerfile            # Gunicorn WSGI container
├── database/
│   └── schema.sql            # Normalized 12-table DDL + comprehensive seed data
├── docs/                     # Architecture, UML ER Diagrams, Deployment Guide
├── postman/                  # Complete Postman API collection covering all phases
├── scripts/                  # Automated verification scripts (verify_system.bat / .sh)
├── docker-compose.yml        # Orchestrates MySQL 8 + Flask AI + Backend + Frontend
└── README.md
```

---

## 3. Quick Start (1-Command Full Stack Docker Deployment)

Launch the entire 4-tier stack with a single command:

```bash
docker compose up --build -d
```

Once started:
* **Web Application**: [`http://localhost`](http://localhost) (or [`http://localhost:5173`](http://localhost:5173))
* **Spring Boot REST APIs**: [`http://localhost:8080/api`](http://localhost:8080/api)
* **Swagger OpenAPI Docs**: [`http://localhost:8080/swagger-ui.html`](http://localhost:8080/swagger-ui.html)
* **Flask AI Health Check**: [`http://localhost:5000/health`](http://localhost:5000/health)

---

## 4. Local Development Setup (Without Docker)

### Step 1: Database Setup
Import the normalized schema and seed records into MySQL 8.0:
```bash
mysql -u root -p < database/schema.sql
```

### Step 2: Backend Setup
```bash
cd backend
mvn spring-boot:run
```
*(Runs on port 8080, connecting to MySQL database `bikehub`)*

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*(Runs on port 5173 with Vite proxying `/api`, `/uploads`, and `/ws` to `localhost:8080`)*

### Step 4: Optional Python AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```
*(Runs on port 5000. If offline, Spring Boot seamlessly switches to its native Java fallback model)*

---

## 5. Seed Accounts for Evaluators

All seeded accounts have the default password: **`password123`** (or use the 1-Click Demo buttons on the login page):

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@bikehub.com` | `password123` | View analytics, verify dealerships, moderate accounts |
| **SELLER** | `seller1@example.com` | `password123` | Manage inventory, add bikes, receive escrow orders |
| **BUYER** | `buyer1@example.com` | `password123` | Wishlist, live chat, book motorcycles via Razorpay |

---

## 6. Automated Testing & Verification

### Running the Backend Test Suite (46 Tests)
```bash
cd backend
mvn test
```
* **AuthServiceTest**: 6 tests (Registration, duplicate email prevention, role assignment, login)
* **BikeServiceTest**: 9 tests (JPA criteria filtering, compare matrix, price validation)
* **OrderServiceTest**: 6 tests (Escrow order state machine, Razorpay signature check, bike locking)
* **ChatReviewNotificationTest**: 7 tests (STOMP WebSocket broadcasts, review aggregation)
* **AdminServiceTest**: 6 tests (Dealership approval, account lockouts)
* **AiAndRecommendationTest**: 4 tests (Content-based filtering, linear regression fallback)
* **AuthControllerTest & BikeControllerTest**: 7 tests (MockMvc HTTP status codes & JSON serialization)
* **Total**: **46/46 Tests Passing (`BUILD SUCCESS`)**

### Running the One-Click Smoke Verification Script
* **Windows**: Double-click or run:
  ```cmd
  scripts\verify_system.bat
  ```
* **Linux / macOS**:
  ```bash
  chmod +x scripts/verify_system.sh
  ./scripts/verify_system.sh
  ```

---

## 7. Cloud Deployment Guide

Detailed deployment walkthroughs for Render, Railway, Vercel, and AWS EC2 are documented in:
👉 [**docs/deployment/DEPLOYMENT_GUIDE.md**](docs/deployment/DEPLOYMENT_GUIDE.md)
