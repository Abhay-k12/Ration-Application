# 📁 Smart-Ration System
 
---
 
## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Module Details](#module-details)
5. [Installation & Setup](#installation--setup)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Contributing Guidelines](#contributing-guidelines)

---

## 🎯 Project Overview

Smart-Ration is a resilient, distributed transaction tracking system designed to strengthen India's Public Distribution System (PDS). It ensures seamless ration distribution during network outages, prevents duplicate claims, and maintains transparent record-keeping between beneficiaries, PDS officers, and administrators.

**Key Features:**
- ✅ Offline transaction recording
- ✅ Face verification integration
- ✅ Duplicate claim prevention
- ✅ Real-time synchronization
- ✅ SMS notifications
- ✅ Complaint management

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | HTML5, CSS3, JavaScript | Beneficiary & PDS Interfaces |
| **Backend** | Java Spring Boot 3.x | REST APIs & Business Logic |
| **Database** | MongoDB | Central Data Storage |
| **Cache** | Redis | Session Management |
| **Queue** | RabbitMQ | Async Processing |
| **Sync** | WebSocket | Real-time Updates |
| **Security** | JWT, OAuth2 | Authentication |
| **AI/ML** | Python/Face Recognition | Face Verification |

---

## 📂 Project Structure

```
RationApplication/
│
├── 📁 src/
│   ├── 📁 main/
│   │   ├── 📁 java/
│   │   │   └── 📁 com/
│   │   │       └── 📁 rationApplication/
│   │   │           ├── 📁 RationApplication.java
│   │   │           │
│   │   │           ├── 📁 config/
│   │   │           │
│   │   │           ├── 📁 controller/
│   │   │           │
│   │   │           ├── 📁 service/
│   │   │           │
│   │   │           ├── 📁 entity/
│   │   │           │
│   │   │           ├── 📁 repository/
│   │   │           │
│   │   │           ├── 📁 dto/
│   │   │           │
│   │   │           ├── 📁 security/
│   │   │           │
│   │   │           ├── 📁 util/
│   │   │           │   ├── 📄 QRCodeGenerator.java
│   │   │           │   ├── 📄 DateUtils.java
│   │   │           │   ├── 📄 FaceEmbeddingUtil.java
│   │   │           │   └── 📄 Constants.java
│   │   │           │
│   │   │           └── 📁 scheduler/
│   │   │               ├── 📄 SyncScheduler.java
│   │   │               └── 📄 ReportScheduler.java
│   │   │
│   │   └── 📁 resources/
│   │       ├── 📄 application.properties
│   │       ├── 📄 application-dev.properties
│   │       ├── 📄 application-prod.properties
│   │       ├── 📁 static/
│   │       ├── 📁 templates/
│   │       └── 📁 db/
│   │           └── 📄 migration/
│   │
│   └── 📁 test/
│       └── 📁 java/
│           └── 📁 com/
│               └── 📁 rationApplication/
│                   ├── 📁 controller/
│                   ├── 📁 service/
│                   └── 📁 repository/
│
├── 📁 frontend/
│   ├── 📁 beneficiary-app/
│   │   ├── 📄 index.html
│   │   ├── 📁 css/
│   │   ├── 📁 js/
│   │   └── 📁 assets/
│   │
│   └── 📁 pds-dashboard/
│       ├── 📄 index.html
│       ├── 📁 css/
│       ├── 📁 js/
│       └── 📁 assets/
│
├── 📁 face-verification/
│   ├── 📄 app.py
│   ├── 📁 models/
│   ├── 📄 requirements.txt
│   └── 📄 Dockerfile
│
├── 📁 scripts/
│   ├── 📄 init-db.js
│   └── 📄 seed-data.js
│
├── 📁 docker/
│   ├── 📄 Dockerfile
│   └── 📄 docker-compose.yml
│
├── 📄 pom.xml
├── 📄 README.md
├── 📄 .gitignore
└── 📄 LICENSE
```
