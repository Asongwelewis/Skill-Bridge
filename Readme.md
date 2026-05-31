<div align="center">

<img src="https://img.shields.io/badge/SkillBridge-Peer%20Learning%20Platform-4F46E5?style=for-the-badge&logo=lightning&logoColor=white" alt="SkillBridge"/>

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗██╗  ██╗██╗██╗     ██╗     ██████╗ ██████╗ ██╗    ║
║   ██╔════╝██║ ██╔╝██║██║     ██║     ██╔══██╗██╔══██╗██║    ║
║   ███████╗█████╔╝ ██║██║     ██║     ██████╔╝██████╔╝██║    ║
║   ╚════██║██╔═██╗ ██║██║     ██║     ██╔══██╗██╔══██╗██║    ║
║   ███████║██║  ██╗██║███████╗███████╗██████╔╝██║  ██║██║    ║
║   ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝    ║
║                                                               ║
║          B R I D G E   T H E   K N O W L E D G E   G A P    ║
╚═══════════════════════════════════════════════════════════════╝
```

**A cloud-native peer learning platform where knowledge flows in every direction.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-K3s-326CE5?style=flat-square&logo=kubernetes)](https://k3s.io)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Kafka](https://img.shields.io/badge/Apache-Kafka-231F20?style=flat-square&logo=apache-kafka)](https://kafka.apache.org)
[![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-D24939?style=flat-square&logo=jenkins)](https://jenkins.io)
[![Grafana](https://img.shields.io/badge/Grafana-Monitoring-F46800?style=flat-square&logo=grafana)](https://grafana.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[🌐 Live Demo](http://skillbridge-sen3244.duckdns.org) · [📚 API Docs](#api-documentation) · [🏗️ Architecture](#architecture) · [🚀 Deploy](#deployment)

</div>

---

## 📖 Table of Contents

- [What is SkillBridge?](#-what-is-skillbridge)
- [The Learning Flow](#-the-learning-flow)
- [Architecture](#-architecture)
- [Microservices](#-microservices)
- [Database Schema](#-database-schema)
- [Design Patterns](#-design-patterns)
- [Infrastructure](#-infrastructure)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Team](#-team)

---

## 🌉 What is SkillBridge?

SkillBridge is a **cloud-native peer-to-peer learning platform** that eliminates the barrier between people who have knowledge and people who need it.

> *"Every expert was once a beginner. Every beginner can become an expert."*

**Core capabilities:**

| Feature | Description |
|---|---|
| 🎯 **Smart Matching** | Algorithm pairs learners with teachers based on skill, proficiency gap, and timezone |
| 📹 **Live Video Sessions** | WebRTC-powered peer-to-peer video calls — no third-party service needed |
| 🤖 **AI-Generated Quizzes** | Groq/Llama 3.3 generates custom MCQs after every session |
| 🏅 **Badge & XP System** | Reputation system rewards teaching and learning milestones |
| 🔍 **Session Search** | Elasticsearch indexes transcripts for full-text search |
| 🔔 **Real-time Notifications** | Supabase Realtime pushes live notifications to the browser |

---

## 🔄 The Learning Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SKILLBRIDGE FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

  👤 USER SIGNS UP          🎯 GETS MATCHED           📹 LIVE SESSION
  ┌─────────────┐          ┌─────────────┐           ┌─────────────┐
  │ • Register  │          │ • Algorithm │           │ • WebRTC    │
  │ • Add skills│  ──────► │   scores    │  ──────►  │   video     │
  │ • Set role  │          │ • Top 5     │           │ • Real-time │
  │   teach/    │          │   matches   │           │   audio     │
  │   learn     │          │   returned  │           └──────┬──────┘
  └─────────────┘          └─────────────┘                  │
                                                             │ session.completed
                                                             ▼ (Kafka event)
  🏅 BADGE AWARDED          📊 QUIZ RESULTS           🤖 AI QUIZ
  ┌─────────────┐          ┌─────────────┐           ┌─────────────┐
  │ • XP +100   │          │ • Score %   │           │ • Groq API  │
  │ • Badge     │  ◄─────  │ • Pass/Fail │  ◄──────  │ • 5 MCQs   │
  │   unlocked  │          │ • Correct   │           │ • Custom to │
  │ • Profile   │          │   answers   │           │   skill     │
  │   updated   │          │   revealed  │           │   taught    │
  └─────────────┘          └─────────────┘           └─────────────┘
```

---

## 🏗️ Architecture

SkillBridge uses a **hybrid microservices architecture** — 5 custom Node.js services backed by Supabase managed services, all running on Kubernetes.

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client Layer"]
        BROWSER["React 18 + Vite\nTailwindCSS + WebRTC"]
    end

    subgraph INGRESS["🌐 Ingress Layer"]
        TRAEFIK["Traefik Ingress Controller\nSSL/TLS + Routing\nskillbridge-sen3244.duckdns.org"]
    end

    subgraph SERVICES["⚙️ Microservices Layer (Kubernetes)"]
        US["👤 User Service\n:3001\nProfiles · Skills · Badges"]
        MS["🎯 Matching Service\n:3002\nAlgorithm · Kafka Consumer"]
        SS["📹 Session Service\n:3003\nWebRTC · Elasticsearch"]
        QS["🤖 Quiz Service\n:3004\nCQRS · Groq AI"]
        NS["🔔 Notification Service\n:3005\nCircuit Breaker"]
    end

    subgraph INFRA["🗄️ Infrastructure Layer"]
        KAFKA["Apache Kafka\nKRaft Mode\nEvent Streaming"]
        REDIS["Redis\nProfile Caching\n< 1ms reads"]
        ELASTIC["Elasticsearch 8.5\nTranscript Search\nFull-text Index"]
        PG["PostgreSQL x4\nStatefulSets\nPer-service DBs"]
    end

    subgraph MANAGED["☁️ Managed Services (Supabase)"]
        AUTH["Supabase Auth\nJWT · OAuth"]
        SUPA_DB["Supabase PostgreSQL\nRLS · Realtime"]
        STORAGE["Supabase Storage\nAvatars · Files"]
    end

    subgraph OBSERVABILITY["📊 Observability"]
        PROM["Prometheus\nMetrics Scraping"]
        GRAFANA["Grafana\nDashboards · Alerts"]
    end

    BROWSER --> TRAEFIK
    TRAEFIK --> US & MS & SS & QS & NS
    US --> REDIS
    US & MS --> SUPA_DB
    SS --> ELASTIC
    SS --> KAFKA
    QS --> KAFKA
    NS --> KAFKA
    MS & SS & QS & NS --> PG
    BROWSER --> AUTH
    PROM --> SERVICES
    PROM --> GRAFANA
```

---

## ⚙️ Microservices

```mermaid
graph LR
    subgraph "User Service :3001"
        U1[GET /profiles/me]
        U2[POST /skills/me]
        U3[GET /badges/me]
        REDIS_CACHE[(Redis Cache\n5min TTL)]
        U1 --> REDIS_CACHE
    end

    subgraph "Matching Service :3002"
        M1[POST /run/:userId]
        M2[GET /matches/me]
        M3[PATCH /matches/:id]
        ALGO[Scoring Algorithm\n60 base\n+20 proficiency\n+20 timezone]
        M1 --> ALGO
    end

    subgraph "Session Service :3003"
        S1[POST /sessions]
        S2[PATCH /:id/start]
        S3[PATCH /:id/end]
        S4[GET /search]
        REPO[Repository Pattern]
        ES[(Elasticsearch)]
        S1 & S2 & S3 --> REPO
        S3 --> ES
        S4 --> ES
    end

    subgraph "Quiz Service :3004"
        Q1[POST /:id/attempt]
        Q2[GET /session/:id]
        CMD[Commands\nGenerateQuiz\nSubmitAttempt]
        QRY[Queries\nGetQuiz\nGetResult]
        GROQ[Groq API\nLlama 3.3 70B]
        Q1 --> CMD
        Q2 --> QRY
        CMD --> GROQ
    end

    subgraph "Notification Service :3005"
        N1[GET /notifications]
        N2[POST /send]
        CB[Circuit Breaker\nOPEN/CLOSED\nHALF_OPEN]
        N2 --> CB
    end
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    profiles ||--o{ user_skills : has
    profiles ||--o{ matches : "is learner"
    profiles ||--o{ matches : "is teacher"
    profiles ||--o{ sessions : hosts
    profiles ||--o{ quiz_attempts : takes
    profiles ||--o{ user_badges : earns
    skills ||--o{ user_skills : "tagged on"
    skills ||--o{ matches : "matched by"
    matches ||--o{ sessions : "leads to"
    sessions ||--o{ quizzes : generates
    quizzes ||--o{ quiz_questions : contains
    quiz_attempts ||--o{ quiz_responses : has
    badges ||--o{ user_badges : "awarded as"

    profiles {
        uuid id PK
        text username
        text full_name
        text avatar_url
        text bio
        text timezone
        int xp_points
    }

    skills {
        uuid id PK
        text name
        text category
        text description
    }

    user_skills {
        uuid id PK
        uuid user_id FK
        uuid skill_id FK
        enum role "teach|learn|both"
        int proficiency_level "1-5"
        bool is_active
    }

    matches {
        uuid id PK
        uuid learner_id FK
        uuid teacher_id FK
        uuid skill_id FK
        enum status "pending|accepted|declined|completed"
        int match_score "0-100"
    }

    sessions {
        uuid id PK
        uuid match_id FK
        uuid host_id FK
        enum status "scheduled|live|completed|cancelled"
        text webrtc_room_id
        timestamptz started_at
        timestamptz ended_at
        int duration_seconds
    }

    quizzes {
        uuid id PK
        uuid session_id FK
        text title
        enum status "draft|published|archived"
        int passing_score
    }

    quiz_questions {
        uuid id PK
        uuid quiz_id FK
        text question_text
        jsonb options
        text correct_answer
    }

    badges {
        uuid id PK
        text name
        text description
        enum criteria_type
        jsonb criteria_value
    }
```

---

## 🎨 Design Patterns

### Repository Pattern — Session Service

```
Controller (HTTP layer)
      │
      ▼
SessionRepository (data access layer)
      │
      ├── findById(id)
      ├── findByUserId(userId, status)
      ├── create({ match_id, host_id, scheduled_at })
      ├── updateStatus(id, status, extraFields)
      ├── findAcceptedMatch(matchId)
      └── completeMatch(matchId)
      │
      ▼
Supabase PostgreSQL
```

### CQRS Pattern — Quiz Service

```
HTTP Request
      │
      ├── Write? ──► Commands/
      │               ├── GenerateQuizCommand.js  (AI → DB write)
      │               └── SubmitAttemptCommand.js  (score → DB write)
      │
      └── Read?  ──► Queries/
                      ├── GetQuizQuery.js    (strips correct answers)
                      └── GetResultQuery.js  (shows answers post-attempt)
```

### Circuit Breaker — Notification Service

```mermaid
stateDiagram-v2
    [*] --> CLOSED
    CLOSED --> OPEN : failures >= threshold (3)
    OPEN --> HALF_OPEN : timeout elapsed (30s)
    HALF_OPEN --> CLOSED : success >= threshold (2)
    HALF_OPEN --> OPEN : any failure

    CLOSED : ✅ Requests flow normally
    OPEN : ❌ Requests fail immediately
    HALF_OPEN : 🔄 One test request allowed
```

---

## 🏗️ Infrastructure

```mermaid
graph TD
    subgraph VPS["DigitalOcean VPS — Ubuntu 24.04 · 8GB RAM · 4vCPU"]
        subgraph K3S["K3s Kubernetes Cluster"]
            subgraph DEFAULT["namespace: default"]
                SVC["5 Microservices\n2 replicas each\nHPA: 2-10 pods"]
                DB["4 PostgreSQL StatefulSets\nassessment-db · matching-db\nsession-db · notification-db"]
                REDIS_K["Redis Master"]
                KAFKA_K["Kafka (KRaft)"]
                ELASTIC_K["Elasticsearch 8.5"]
            end
            subgraph MONITORING["namespace: monitoring"]
                PROM_K["Prometheus"]
                GRAF_K["Grafana :3000"]
                ALERT["AlertManager"]
            end
            subgraph SYSTEM["namespace: kube-system"]
                TRAEFIK_K["Traefik Ingress"]
                CERTMGR["cert-manager\nLet's Encrypt SSL"]
            end
        end
    end

    INTERNET["🌐 Internet"] --> TRAEFIK_K
    TRAEFIK_K --> SVC
    SVC --> DB & REDIS_K & KAFKA_K & ELASTIC_K
    CERTMGR --> TRAEFIK_K
```

### CAP Theorem Strategy

| Service | Strategy | Reason |
|---|---|---|
| Session Service | **CP** | WebRTC room IDs must be consistent |
| Quiz Service | **CP** | Scores must be accurate for badges |
| User Service | **AP** | Slightly stale profiles acceptable |
| Matching Service | **AP** | Old matches OK, availability priority |
| Notification Service | **AP** | Delayed notification > no notification |

---

## 🔄 CI/CD Pipeline

```mermaid
graph LR
    DEV["👨‍💻 Developer\ngit push"] --> GH["GitHub\nmain branch"]
    GH --> JENKINS["Jenkins\nBuild Now"]

    subgraph PIPELINE["Jenkins 5-Stage Pipeline"]
        C["① Checkout\ngit pull"] --> T
        T["② Test\nJest parallel\n5 services"] --> B
        B["③ Build\nDocker images\n+ frontend"] --> P
        P["④ Push\nDocker Hub\n:latest + :N"] --> D
        D["⑤ Deploy\nkubectl rolling\nupdate"]
    end

    JENKINS --> C
    D --> K8S["Kubernetes\nZero-downtime\nrollout"]
    K8S --> LIVE["🌐 Live at\nskillbridge-sen3244\n.duckdns.org"]
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 20 + Express | All 5 microservices |
| Supabase | Auth, managed PostgreSQL, Realtime, Storage |
| Apache Kafka (KRaft) | Event streaming between services |
| Redis | Profile caching (< 1ms reads) |
| Elasticsearch 8.5 | Session transcript full-text search |
| PostgreSQL x4 | Per-service StatefulSet databases |
| Groq API (Llama 3.3 70B) | AI quiz generation |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | SPA framework |
| TailwindCSS v4 | Utility-first styling |
| React Router v7 | Client-side routing |
| Supabase JS | Auth + Realtime subscriptions |
| Axios | API calls with JWT interceptor |
| lucide-react | Icon system |
| WebRTC (native) | Peer-to-peer video sessions |

### Infrastructure
| Technology | Purpose |
|---|---|
| K3s (Kubernetes) | Container orchestration |
| Docker | Containerisation |
| Helm | Package management |
| Traefik | Ingress + SSL termination |
| cert-manager + Let's Encrypt | Automatic SSL certificates |
| Jenkins | CI/CD pipeline |
| Prometheus + Grafana | Metrics + dashboards |
| Ansible | Configuration management (4 playbooks) |
| Terraform | Infrastructure as Code |
| DigitalOcean | Cloud VPS provider |

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
node >= 20
docker
kubectl
helm

# Optional (for local dev)
k3s or minikube
```

### Clone & Setup

```bash
git clone https://github.com/Asongwelewis/Skill-Bridge.git
cd Skill-Bridge
```

### Environment Variables

Each service needs a `.env` file. Copy from the example:

```bash
cp Services/user-service/.env.example        Services/user-service/.env
cp Services/matching-service/.env.example    Services/matching-service/.env
cp Services/session-service/.env.example     Services/session-service/.env
cp Services/quiz-service/.env.example        Services/quiz-service/.env
cp Services/notification-service/.env.example Services/notification-service/.env
cp frontend/.env.example                     frontend/.env
```

Fill in each `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_secret_key
KAFKA_BROKER=localhost:9092
GROQ_API_KEY=gsk_your_groq_key         # quiz-service only
ELASTIC_URL=https://localhost:9200      # session-service only
```

### Run Locally

```bash
# Install dependencies for all services
cd Services/user-service && npm install && cd ../..
cd Services/matching-service && npm install && cd ../..
cd Services/session-service && npm install && cd ../..
cd Services/quiz-service && npm install && cd ../..
cd Services/notification-service && npm install && cd ../..
cd frontend && npm install && cd ..

# Run a service
cd Services/user-service && npm run dev    # port 3001
cd Services/matching-service && npm run dev # port 3002
cd Services/session-service && npm run dev  # port 3003
cd Services/quiz-service && npm run dev     # port 3004
cd Services/notification-service && npm run dev # port 3005
cd frontend && npm run dev                  # port 5173
```

### Run Tests

```bash
cd Services/user-service && npm test
cd Services/matching-service && npm test
cd Services/session-service && npm test
cd Services/quiz-service && npm test
cd Services/notification-service && npm test
```

### Deploy to Kubernetes

```bash
# Create secrets
kubectl create secret generic user-service-secret \
  --from-literal=SUPABASE_URL=https://... \
  --from-literal=SUPABASE_SECRET_KEY=...

# Apply all manifests
kubectl apply -f k8s/

# Or trigger Jenkins pipeline
# → http://your-vps:8080 → SkillBridge → Build Now
```

---

## 📚 API Documentation

All services are accessible via the Traefik ingress at `http://skillbridge-sen3244.duckdns.org`

### User Service `/api/users`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/profiles/me` | Get my profile |
| `PUT` | `/profiles/me` | Update my profile |
| `GET` | `/profiles/:id` | Get any profile |
| `GET` | `/skills/me` | Get my skills |
| `POST` | `/skills/me` | Add a skill |
| `DELETE` | `/skills/me/:id` | Remove a skill |
| `GET` | `/badges/me` | Get my badges |

### Matching Service `/api/matching`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/run/:userId` | Trigger matching algorithm |
| `GET` | `/matches/me` | Get my matches |
| `PATCH` | `/matches/:id` | Accept or decline a match |

### Session Service `/api/sessions`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Schedule a session |
| `GET` | `/me` | Get my sessions |
| `PATCH` | `/:id/start` | Go live |
| `PATCH` | `/:id/end` | End session + trigger quiz |
| `GET` | `/search?q=` | Search transcripts |

### Quiz Service `/api/quizzes`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/session/:sessionId` | Get quiz for session |
| `POST` | `/:quizId/attempt` | Submit answers |
| `GET` | `/:quizId/result` | Get my result |

### Notification Service `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get my notifications |
| `PATCH` | `/:id/read` | Mark as read |
| `PATCH` | `/read-all` | Mark all read |
| `GET` | `/circuit-status` | Circuit breaker state |

---

## 👥 Team

| Role | Responsibility |
|---|---|
| **Product Owner / App Lead** | Microservices, Kafka schemas, Supabase schema, React frontend, API docs |
| **Scrum Master / DevOps Lead** | Terraform, Ansible, Jenkins, K8s manifests, Prometheus/Grafana, NGINX |

**Course:** SEN3244 — Software Architecture
**Institution:** ICT University — Faculty of Information and Communication Technologies
**Instructor:** Engr. Tekoh Palma
**Season:** Spring 2026

---

<div align="center">

**Built with ❤️ by the SkillBridge team**

*"The best way to learn is to teach."*

[![Deploy Status](https://img.shields.io/badge/deployment-live-brightgreen?style=flat-square)](http://skillbridge-sen3244.duckdns.org)
[![Made with](https://img.shields.io/badge/made%20with-Node.js%20%2B%20React-blue?style=flat-square)](https://github.com/Asongwelewis/Skill-Bridge)

</div>