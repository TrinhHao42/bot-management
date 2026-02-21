# Bot Management

A comprehensive full-stack solution for multi-source job crawling, automated monitoring, and real-time management. Built with **NestJS** and **Next.js**, this system empowers users to track job opportunities across various platforms with automated data export and real-time updates.

## Key Features

- **Multi-Source Crawler**: Supports scraping from TopCV, CareerViet, LinkedIn, Indeed, and more.
- **Google Sheets Integration**: Automated export of crawled data directly to Google Sheets for easy management.
- **Smart Scheduler**: Set up automated crawling tasks with customizable intervals.
- **Real-time Interaction**: Interactive chat interface with real-time logs via WebSockets.
- **Multilingual (i18n)**: Support for English and Vietnamese out of the box.
- **Dockerized**: Easy deployment with Docker and Docker Compose.
- **Professional UI**: Responsive dashboard built with Next.js and TailwindCSS.

## Technology Stack

### Backend
- **Core**: NestJS (Node.js framework)
- **Real-time**: Socket.io (WebSockets)
- **Database**: TypeORM (PostgreSQL/MySQL compatible)
- **Automation**: NestJS Schedule (Cron jobs)
- **Crawler**: Playwright/Puppeteer for high-performance scraping

### Frontend
- **Framework**: Next.js 15+
- **Styling**: TailwindCSS & PostCSS
- **State Management**: React Context API
- **Communication**: Axios & Socket.io Client
- **Notifications**: Custom Toast system

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (Recommended)
- NPM or PNPM

### Option 1: Using Docker (Recommended)
1. Clone the repository:
   ```bash
   git clone https://github.com/TrinhHao42/bot_management.git
   cd bot_management
   ```
2. Start the entire stack:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```
3. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

### Option 2: Local Development

#### Backend Setup
```bash
cd backend-bot
npm install
npm run start:dev
```

#### Frontend Setup
```bash
cd ui-app
npm install
npm run dev
```

## Usage Guide
1. **Dashboard**: Monitor your bots and see live status updates.
2. **Bot Manager**: Add, edit, or remove crawler bots.
3. **Settings**: Configure your Google Sheets API and language preferences.
4. **Chat**: Interact with the system to trigger manual crawls or check logs.