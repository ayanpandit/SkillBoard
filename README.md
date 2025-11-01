# 🎯 SkillBoard - Competitive Programming Profile Analysis Platform# 🚀 SkillBoard - Coding Profile Analysis Platform



<div align="center">**SkillBoard** is a comprehensive technical hiring platform that helps recruiters and hiring teams analyze competitive programming profiles from platforms like CodeChef, LeetCode, and Codeforces to make data-driven hiring decisions.



![SkillBoard Logo](./Frontend/public/logo.png)![SkillBoard Banner](Frontend/public/logo.png)



[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)## 🌟 Features

[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)### 🔍 **Multi-Platform Analysis**

[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.17-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)- **CodeChef Profile Analyzer**: Detailed analysis of competitive programming skills, contest participation, and star ratings

[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)- **LeetCode Profile Analyzer**: Comprehensive metrics on problem-solving abilities, algorithm proficiency, and coding patterns

- **Codeforces Profile Analyzer**: Performance tracking, rating analysis, and contest participation metrics

**Empower your technical hiring with data-driven insights from CodeChef, LeetCode, and CodeForces profiles**

### 📊 **Comprehensive Metrics**

[Live Demo](https://skillboard.shop) • [Report Bug](https://github.com/ayanpandit/SkillBoard/issues) • [Request Feature](https://github.com/ayanpandit/SkillBoard/issues)- **Problem-solving Statistics**: Difficulty-wise breakdown (Easy/Medium/Hard)

- **Contest Performance**: Participation rates, rankings, and performance trends

</div>- **Activity Heatmaps**: Visual representation of coding activity over time

- **Language Proficiency**: Programming languages used and problem distribution

---- **Badge System**: Achievement tracking and skill level assessment



## 📑 Table of Contents### 🎯 **Hiring-Focused Features**

- **Bulk Profile Analysis**: Upload CSV files to analyze multiple candidates simultaneously

- [✨ Features](#-features)- **Advanced Filtering**: Filter candidates by various criteria (rating, problems solved, etc.)

- [🏗️ Architecture Overview](#️-architecture-overview)- **Export Functionality**: Download analysis results in Excel format

- [🚀 Quick Start](#-quick-start)- **Real-time Processing**: Live progress tracking for bulk operations

- [📦 Tech Stack](#-tech-stack)- **Secure Authentication**: User account management with Supabase integration

- [🔧 Configuration](#-configuration)

- [🌐 API Endpoints](#-api-endpoints)### 🔐 **Security & Performance**

- [📱 Frontend Components](#-frontend-components)- **JWT-based Authentication**: Secure user sessions with Supabase

- [🔐 Authentication System](#-authentication-system)- **Rate Limiting**: Optimized API calls to prevent abuse

- [⚡ Performance Optimization](#-performance-optimization)- **Caching System**: Efficient data retrieval with TTL-based caching

- [🎨 UI/UX Design](#-uiux-design)- **Responsive Design**: Mobile-first approach with Tailwind CSS

- [📊 Data Flow](#-data-flow)

- [🔄 Deployment](#-deployment)## 🛠️ Tech Stack

- [🧪 Testing](#-testing)

- [🤝 Contributing](#-contributing)### Frontend

- [📄 License](#-license)- **React 18** - Modern React with Hooks and Context API

- **Vite** - Fast build tool and development server

---- **Tailwind CSS** - Utility-first CSS framework

- **React Router Dom** - Client-side routing

## ✨ Features- **Axios** - HTTP client for API requests

- **Lucide React** - Beautiful icon library

### 🎯 **Core Functionality**- **XLSX** - Excel file processing

- **Multi-Platform Support**: Analyze profiles from CodeChef, LeetCode, and CodeForces- **D3.js** - Data visualization for heatmaps

- **Bulk Profile Analysis**: Upload Excel files with up to 100+ usernames for parallel processing

- **Real-Time Data Fetching**: Live data from competitive programming platforms### Backend

- **Comprehensive Metrics**: Problem-solving stats, rating history, contest participation, and more- **Node.js & Express** - High-performance server architecture

- **Admin Access**: Secure admin login for authorized personnel without Supabase authentication- **Worker Threads** - Multi-threaded processing for bulk operations

- **GraphQL Integration** - Efficient data fetching from LeetCode API

### 📊 **Analytics & Visualization**- **Connection Pooling** - Optimized HTTP connections

- **Interactive Charts**: D3.js powered visualizations for rating trends and problem distribution- **PM2 Ready** - Production process management

- **Heatmaps**: Activity heatmaps showing submission patterns

- **Progress Tracking**: Real-time progress indicators during bulk searches### Database & Authentication

- **Comparative Analysis**: Side-by-side comparison of multiple candidates- **Supabase** - Backend-as-a-Service with PostgreSQL

- **JWT Authentication** - Secure token-based auth

### 🔐 **Authentication & Security**- **Real-time subscriptions** - Live data updates

- **Supabase Auth**: Email/password and OTP-based authentication

- **Admin Login**: Environment-based admin credentials for quick access### Deployment & DevOps

- **Protected Routes**: Role-based access control for sensitive pages- **Render** - Cloud hosting platform

- **Session Management**: Persistent sessions with localStorage backup- **Vercel/Netlify Ready** - Frontend deployment options

- **Railway Integration** - Alternative deployment platform

### ⚡ **Performance Features**- **Docker Support** - Containerized deployment

- **Parallel Processing**: Multi-worker architecture for bulk searches (4x faster)- **Environment Variables** - Secure configuration management

- **Rate Limiting**: Smart rate limiting to comply with platform APIs

- **Connection Pooling**: Optimized HTTP connection reuse## 🚀 Quick Start

- **Caching Strategy**: TTL-based caching for frequently accessed data

- **Lazy Loading**: Code splitting and lazy-loaded components### Prerequisites

- Node.js 18+ 

### 🎨 **User Experience**- npm or yarn

- **Responsive Design**: Mobile-first approach with Tailwind CSS- Git

- **Dark Theme**: Modern glass morphism UI with backdrop blur effects

- **Toast Notifications**: Real-time feedback for user actions### 🔧 Installation

- **Excel Export**: Download analysis results as formatted Excel files

- **SEO Optimized**: Meta tags, Open Graph, and schema.org structured data1. **Clone the repository**

```bash

---git clone https://github.com/ayanpandit/SkillBoard.git

cd SkillBoard

## 🏗️ Architecture Overview```



### **System Architecture**2. **Install Frontend Dependencies**

```bash

```cd Frontend

┌─────────────────────────────────────────────────────────────────┐npm install

│                         FRONTEND (React)                         │```

│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │

│  │   Home Page  │  │  Analyzers   │  │  Profile/Admin     │   │3. **Install Backend Dependencies**

│  │   (Hero +    │  │  (CodeChef,  │  │  (User Dashboard)  │   │```bash

│  │   Features)  │  │   LeetCode,  │  │                    │   │cd ../backend/leetcodebackend

│  │              │  │  CodeForces) │  │                    │   │npm install

│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘   │```

│         │                  │                     │              │

│         └──────────────────┼─────────────────────┘              │4. **Environment Setup**

│                            │                                    │

│                    ┌───────▼────────┐                          │Create `.env` files in both frontend and backend directories:

│                    │   Auth Context │                          │

│                    │   (Supabase +  │                          │**Frontend (.env)**

│                    │   Admin Auth)  │                          │```env

│                    └───────┬────────┘                          │# LeetCode API

└────────────────────────────┼───────────────────────────────────┘VITE_API_URL=https://your-leetcode-backend.onrender.com/api/leetcode

                             │VITE_API_BULK_URL=https://your-leetcode-backend.onrender.com/api/leetcode/bulk

              ┌──────────────┼──────────────┐

              │              │              │# CodeChef API

              ▼              ▼              ▼VITE_CODECHEF_API_URL=https://your-codechef-backend.onrender.com/api/codechef

    ┌─────────────┐ ┌──────────────┐ ┌─────────────┐

    │  CodeChef   │ │   LeetCode   │ │ CodeForces  │# CodeChef Bulk Search - Multiple API Endpoints

    │   Backend   │ │    Backend   │ │   Backend   │VITE_CODECHEF_API_URL_1=https://your-codechef-backend.onrender.com/api/codechef

    │  (Python)   │ │  (Node.js)   │ │  (Node.js)  │VITE_CODECHEF_API_URL_2=https://your-codechef-backend-1.onrender.com/api/codechef

    └──────┬──────┘ └──────┬───────┘ └──────┬──────┘VITE_CODECHEF_API_URL_3=https://your-codechef-backend-2.onrender.com/api/codechef

           │               │                 │VITE_CODECHEF_API_URL_4=https://your-codechef-backend-3.onrender.com/api/codechef

           │               │                 │VITE_CODECHEF_API_URL_5=https://your-codechef-backend-4.onrender.com/api/codechef

           ▼               ▼                 ▼VITE_CODECHEF_API_URL_6=https://your-codechef-backend-5.onrender.com/api/codechef

    ┌─────────────────────────────────────────────┐

    │          External Platform APIs              │# CodeForces API

    │  • codechef.com  • leetcode.com             │VITE_CODEFORCES_API_URL=https://your-codeforces-backend.onrender.com/api/codeforces

    │  • codeforces.com                           │VITE_CODEFORCES_API_BULK_URL=https://your-codeforces-backend.onrender.com/api/codeforces/bulk

    └─────────────────────────────────────────────┘

```# Supabase Configuration

VITE_SUPABASE_URL=https://your-project.supabase.co

### **Frontend Architecture**VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

VITE_SUPABASE_SITE_URL=https://your-production-url.com

``````

src/

├── components/          # React components**Backend (.env)**

│   ├── Home.jsx                    # Landing page with platform cards```env

│   ├── Navbar.jsx                  # Navigation with dropdownsNODE_ENV=development

│   ├── LoginSignup.jsx             # Auth modal (Supabase)PORT=3000

│   ├── AdminLogin.jsx              # Admin authenticationCORS_ORIGIN=http://localhost:5173

│   ├── Profile.jsx                 # User dashboard```

│   ├── About.jsx                   # About page

│   ├── SEO.jsx                     # Dynamic SEO component> **Note**: A `.env.example` file is provided in the Frontend directory. Copy it to `.env` and fill in your actual values.

│   ├── CodeChefProfileAnalyzer.jsx # CodeChef analyzer

│   ├── LeetCodeProfileAnalyzer.jsx # LeetCode analyzer5. **Configure Supabase**

│   └── CodeForcesProfileAnalyzer.jsx # CodeForces analyzer

│The application uses environment variables for Supabase configuration. Make sure to set:

├── context/            # React context providers- `VITE_SUPABASE_URL`: Your Supabase project URL

│   ├── AuthContext.jsx             # Authentication state management- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

│   └── ToastContext.jsx            # Toast notification system- `VITE_SUPABASE_SITE_URL`: Your production URL for email redirects

│

├── utils/              # Utility functions### 🏃‍♂️ Running the Application

│   ├── codechefBulkManager.js      # Bulk search orchestrator

│   └── codechefBulkConfig.js       # Configuration for bulk operations1. **Start the Backend Server**

│```bash

├── App.jsx             # Main app with routingcd backend/leetcodebackend

├── main.jsx            # React entry pointnpm run dev

└── index.css           # Global styles + Tailwind```

```

2. **Start the Frontend Development Server**

### **Backend Architecture**```bash

cd Frontend

```npm run dev

backend/```

├── codechefbackend/    # Python Flask backend

│   ├── sb.py                       # Main scraper with BeautifulSoup3. **Access the Application**

│   ├── requirements.txt            # Python dependencies- Frontend: `http://localhost:5173`

│   └── Procfile                    # Render deployment config- Backend API: `http://localhost:3000`

│

├── leetcodebackend/    # Node.js Express backend## 📁 Project Structure

│   ├── server.js                   # Main server with worker threads

│   ├── package.json                # Node dependencies```

│   └── Procfile                    # Render deployment configSkillBoard/

│├── Frontend/                 # React frontend application

└── codeforcesbackend/  # Node.js Express backend│   ├── public/              # Static assets

    ├── server.js                   # API server with SHA-512 auth│   ├── src/

    ├── package.json                # Node dependencies│   │   ├── components/      # React components

    ├── .env.example                # Environment variables template│   │   │   ├── Home.jsx

    ├── Procfile                    # Render deployment config│   │   │   ├── Navbar.jsx

    └── DEPLOYMENT.md               # Deployment guide│   │   │   ├── LoginSignup.jsx

```│   │   │   ├── CodeChefProfileAnalyzer.jsx

│   │   │   ├── LeetCodeProfileAnalyzer.jsx

---│   │   │   └── CodeForcesProfileAnalyzer.jsx

│   │   ├── context/         # React Context providers

## 🚀 Quick Start│   │   │   ├── AuthContext.jsx

│   │   │   └── ToastContext.jsx

### **Prerequisites**│   │   ├── assets/          # Images and static files

│   │   └── utils/           # Utility functions

- **Node.js**: v18+ (with npm)│   ├── package.json

- **Python**: 3.9+ (for CodeChef backend)│   └── vite.config.js

- **Git**: For version control├── backend/                 # Backend services

- **Supabase Account**: For authentication (free tier available)│   └── leetcodebackend/     # LeetCode API service

│       ├── server.js        # Main server file

### **Installation**│       └── package.json

└── README.md

#### 1. **Clone the Repository**```



```bash## 🎨 Features Deep Dive

git clone https://github.com/ayanpandit/SkillBoard.git

cd SkillBoard### 🔍 Profile Analysis

```- **Real-time Data Fetching**: Direct integration with platform APIs

- **Comprehensive Metrics**: Problem-solving patterns, contest performance, skill assessment

#### 2. **Frontend Setup**- **Visual Representations**: Heatmaps, charts, and progress indicators

- **Error Handling**: Graceful handling of profile errors and edge cases

```bash

cd Frontend### 📈 Bulk Processing

npm install- **CSV Upload**: Support for large candidate lists

- **Progress Tracking**: Real-time processing updates

# Create .env file from template- **Concurrent Processing**: Multi-threaded backend for faster results

cp .env.example .env- **Export Options**: Download results in multiple formats



# Add your API keys to .env### 🔐 User Management

# VITE_SUPABASE_URL=your_supabase_url- **Secure Authentication**: Email/password and OTP login options

# VITE_SUPABASE_ANON_KEY=your_supabase_key- **Profile Management**: User dashboard and settings

# VITE_ADMIN_USERNAME=admin- **Session Persistence**: Automatic login state management

# VITE_ADMIN_PASSWORD=your_secure_password- **Protected Routes**: Role-based access control

```

## 🚀 Deployment

#### 3. **Backend Setup - CodeChef**

### Frontend Deployment (Vercel/Netlify)

```bash

cd ../backend/codechefbackend1. **Build the project**

pip install -r requirements.txt```bash

cd Frontend

# Run the servernpm run build

python sb.py```

# Server runs on http://localhost:5000

```2. **Deploy to Vercel**

```bash

#### 4. **Backend Setup - LeetCode**vercel --prod

```

```bash

cd ../leetcodebackend3. **Deploy to Netlify**

npm install```bash

npm run deploy

# Run the server```

npm start

# Server runs on http://localhost:3000### Backend Deployment (Render)

```

1. **Connect your GitHub repository to Render**

#### 5. **Backend Setup - CodeForces**2. **Set environment variables**

3. **Deploy with auto-deploy enabled**

```bash

cd ../codeforcesbackend### Environment Variables for Production

npm install

**Frontend Production Environment**

# Create .env file```env

cp .env.example .envVITE_API_URL_PROD=https://your-backend.onrender.com

VITE_API_BULK_URL_PROD=https://your-backend.onrender.com/bulk

# Add your CodeForces API credentials```

# CODEFORCES_API_KEY=your_key

# CODEFORCES_API_SECRET=your_secret**Backend Production Environment**

```env

npm startNODE_ENV=production

# Server runs on http://localhost:10000PORT=3000

```CORS_ORIGIN=https://your-frontend.vercel.app

```

#### 6. **Start Development Server**

## 📊 API Documentation

```bash

cd ../../Frontend### Core Endpoints

npm run dev

# Frontend runs on http://localhost:5173#### LeetCode API

```- `GET /api/leetcode/:username` - Get user profile data

- `POST /api/leetcode/bulk` - Process multiple users

### **Access the Application**

#### CodeChef API

- **Frontend**: http://localhost:5173- `GET /api/codechef/:username` - Get user profile data

- **CodeChef API**: http://localhost:5000- `POST /api/codechef/bulk` - Process multiple users

- **LeetCode API**: http://localhost:3000

- **CodeForces API**: http://localhost:10000#### Codeforces API

- `GET /api/codeforces/:username` - Get user profile data

---- `POST /api/codeforces/bulk` - Process multiple users



## 📦 Tech Stack### Response Format

```json

### **Frontend**{

  "username": "example_user",

| Technology | Version | Purpose |  "profile": {

|------------|---------|---------|    "realName": "John Doe",

| **React** | 18.3.1 | UI framework |    "ranking": 12345,

| **Vite** | 6.3.5 | Build tool & dev server |    "location": "India"

| **React Router** | 7.6.1 | Client-side routing (HashRouter) |  },

| **Tailwind CSS** | 3.4.17 | Utility-first styling |  "stats": {

| **Axios** | 1.9.0 | HTTP client |    "Easy": { "solved": 150, "total": 200 },

| **D3.js** | 7.9.0 | Data visualization |    "Medium": { "solved": 100, "total": 300 },

| **Lucide React** | 0.511.0 | Icon library |    "Hard": { "solved": 50, "total": 150 }

| **XLSX** | 0.18.5 | Excel file processing |  },

| **Supabase** | 2.50.0 | Authentication & database |  "activity": {

    "totalActiveDays": 365,

### **Backend**    "streak": 30

  }

#### CodeChef Backend (Python)}

| Technology | Purpose |```

|------------|---------|

| **Flask** | Web framework |## 🤝 Contributing

| **BeautifulSoup4** | HTML parsing & web scraping |

| **Requests** | HTTP library |We welcome contributions! Please follow these steps:

| **Flask-CORS** | Cross-origin resource sharing |

1. **Fork the repository**

#### LeetCode Backend (Node.js)2. **Create a feature branch**

| Technology | Purpose |```bash

|------------|---------|git checkout -b feature/amazing-feature

| **Express** | Web framework |```

| **Worker Threads** | Parallel processing |3. **Commit your changes**

| **HTTPS Agent** | Connection pooling |```bash

git commit -m 'Add amazing feature'

#### CodeForces Backend (Node.js)```

| Technology | Purpose |4. **Push to the branch**

|------------|---------|```bash

| **Express** | Web framework |git push origin feature/amazing-feature

| **Axios** | HTTP client |```

| **Crypto** | SHA-512 API signature generation |5. **Open a Pull Request**

| **CORS** | Cross-origin support |

### 🛠️ Development Guidelines

### **Development Tools**

- Follow React best practices and hooks patterns

- **ESLint**: Code linting- Use Tailwind CSS for styling

- **Prettier**: Code formatting (implicit)- Implement proper error handling

- **PostCSS**: CSS processing- Add meaningful comments to complex logic

- **Autoprefixer**: CSS vendor prefixing- Ensure responsive design compatibility

- Test thoroughly across different platforms

---

## 📄 License

## 🔧 Configuration

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### **Environment Variables**

## 👥 Team

#### **Frontend (.env)**

- **Ayan Pandit** - Full Stack Developer

```env- **GitHub**: [@ayanpandit](https://github.com/ayanpandit)

# API Endpoints

VITE_API_URL=https://your-leetcode-backend.onrender.com/api/leetcode## 🙏 Acknowledgments

VITE_API_BULK_URL=https://your-leetcode-backend.onrender.com/api/leetcode/bulk

VITE_CODECHEF_API_URL=https://your-codechef-backend.onrender.com/api/codechef- **React Team** for the amazing framework

VITE_CODEFORCES_API_URL=https://your-codeforces-backend.onrender.com/api/codeforces- **Tailwind CSS** for the utility-first CSS framework

VITE_CODEFORCES_API_BULK_URL=https://your-codeforces-backend.onrender.com/api/codeforces/bulk- **Supabase** for the backend infrastructure

- **LeetCode, CodeChef, Codeforces** for providing public APIs

# CodeChef Bulk Search (6 worker endpoints)- **Open Source Community** for continuous inspiration

VITE_CODECHEF_API_URL_1=https://codechef-1.onrender.com/api/codechef

VITE_CODECHEF_API_URL_2=https://codechef-2.onrender.com/api/codechef## 📞 Support

VITE_CODECHEF_API_URL_3=https://codechef-3.onrender.com/api/codechef

VITE_CODECHEF_API_URL_4=https://codechef-4.onrender.com/api/codechefFor support, email ayanpandit.dev@gmail.com or create an issue in the GitHub repository.

VITE_CODECHEF_API_URL_5=https://codechef-5.onrender.com/api/codechef

VITE_CODECHEF_API_URL_6=https://codechef-6.onrender.com/api/codechef## 🔗 Links



# Supabase Configuration- **Live Demo**: [https://skillboard.shop](https://skillboard.shop)

VITE_SUPABASE_URL=https://your-project.supabase.co- **GitHub Repository**: [https://github.com/ayanpandit/SkillBoard](https://github.com/ayanpandit/SkillBoard)

VITE_SUPABASE_ANON_KEY=your-supabase-anon-key- **Documentation**: [Wiki](https://github.com/ayanpandit/SkillBoard/wiki)

VITE_SUPABASE_SITE_URL=https://skillboard.shop

---

# CodeForces API Credentials

VITE_CODEFORCES_API_KEY=your-codeforces-api-key**Made with ❤️ for the developer community**

VITE_CODEFORCES_API_SECRET=your-codeforces-api-secret

*Simplifying technical hiring through data-driven insights*
# Admin Login
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=YourSecurePassword123!
```

#### **CodeForces Backend (.env)**

```env
PORT=10000
NODE_ENV=production
CODEFORCES_API_KEY=your-api-key
CODEFORCES_API_SECRET=your-api-secret
```

### **Bulk Search Configuration**

Edit `Frontend/src/utils/codechefBulkConfig.js`:

```javascript
export const CONFIG = {
  NUM_WORKERS: 6,                 // Number of parallel workers
  DELAY_BETWEEN_REQUESTS: 1500,   // Delay in ms (1.5 seconds)
  RANDOM_JITTER: 500,             // Random variation (0-500ms)
  MAX_RETRIES: 2,                 // Retry failed requests
  RETRY_DELAY: 3000,              // Wait before retry (3 seconds)
  REQUEST_TIMEOUT: 30000,         // Request timeout (30 seconds)
  VERBOSE_LOGGING: false          // Enable detailed logs
};
```

**Performance Tuning:**
- **More workers** = Faster but higher server load
- **Less delay** = Faster but may hit rate limits
- **More retries** = More reliable but slower on failures

---

## 🌐 API Endpoints

### **CodeChef Backend**

```http
GET /api/codechef?username={username}
```

**Response:**
```json
{
  "username": "chef123",
  "name": "John Doe",
  "rating": 1850,
  "stars": "4★",
  "globalRank": 12543,
  "countryRank": 2341,
  "problemsSolved": 325,
  "contestParticipation": 45,
  "submissionHeatmap": [...],
  "languageStats": {...},
  "difficultyDistribution": {...}
}
```

### **LeetCode Backend**

```http
# Single user
GET /api/leetcode?username={username}

# Bulk search
POST /api/leetcode/bulk
Content-Type: application/json

{
  "usernames": ["user1", "user2", "user3"]
}
```

**Response:**
```json
{
  "username": "leetcoder",
  "ranking": 125432,
  "reputation": 156,
  "totalSolved": 450,
  "easySolved": 200,
  "mediumSolved": 180,
  "hardSolved": 70,
  "acceptanceRate": 45.2,
  "contributionPoints": 120,
  "recentSubmissions": [...]
}
```

### **CodeForces Backend**

```http
# User info
GET /api/codeforces/user.info?username={handle}

# User rating history
GET /api/codeforces/user.rating?username={handle}

# User submissions
GET /api/codeforces/user.status?username={handle}

# Bulk search
POST /api/codeforces/bulk
Content-Type: application/json

{
  "handles": ["tourist", "Benq", "Errichto"]
}
```

**Response:**
```json
{
  "handle": "tourist",
  "rating": 3821,
  "maxRating": 3869,
  "rank": "Legendary Grandmaster",
  "maxRank": "Legendary Grandmaster",
  "contribution": 126,
  "friendOfCount": 12543,
  "problemsSolved": 4521,
  "contestsParticipated": 245,
  "ratingHistory": [...],
  "problemStats": {...}
}
```

---

## 📱 Frontend Components

### **Component Hierarchy**

```
App (HashRouter)
├── Navbar
│   ├── Logo
│   ├── Navigation Menu
│   │   ├── Home
│   │   ├── Services (Dropdown)
│   │   │   ├── CodeChef
│   │   │   ├── LeetCode
│   │   │   └── CodeForces
│   │   ├── About
│   │   └── Contact
│   └── User Menu (Dropdown)
│       ├── Profile
│       └── Logout
│
├── SEO (Dynamic meta tags)
│
└── Routes
    ├── / → HomePage
    │   ├── Hero Section
    │   ├── Platform Cards (4 cards)
    │   └── Footer with Social Links
    │
    ├── /codechefloder → CodeChefLoader → CodeChefProfileAnalyzer
    │   ├── Single User Search
    │   ├── Bulk Excel Upload
    │   ├── Results Table with Filters
    │   ├── Interactive Charts (D3.js)
    │   ├── Heatmap Visualization
    │   └── Export to Excel
    │
    ├── /leetcodeloder → LeetCodeLoader → LeetCodeProfileAnalyzer
    │   ├── Username Search
    │   ├── Profile Stats
    │   ├── Problem Distribution Chart
    │   └── Recent Submissions
    │
    ├── /codeforcesloder → CodeForcesLoader → CodeForcesProfileAnalyzer
    │   ├── Handle Search
    │   ├── Rating Graph
    │   ├── Contest History
    │   └── Problem Statistics
    │
    ├── /about → About
    │   └── Platform information
    │
    └── /profile → Profile (Protected)
        ├── User Info
        ├── Saved Analyses
        └── Settings
```

### **Key Components Deep Dive**

#### **Navbar.jsx**
- **Features**: 
  - Sticky navbar with scroll effects
  - Glass morphism design with backdrop blur
  - Horizontal dropdown for services
  - User authentication state management
  - Mobile responsive hamburger menu
  - Admin badge indicator
- **State Management**: 
  - `openDropdown`: Controls service dropdown visibility
  - `showUserDropdown`: Controls user menu visibility
  - `isMenuOpen`: Controls mobile menu
  - `showLoginSignup`: Controls login modal

#### **CodeChefProfileAnalyzer.jsx**
- **Features**:
  - Single username search with instant feedback
  - Bulk Excel upload (supports .xlsx, .xls, .csv)
  - Parallel processing with progress tracking
  - Real-time results table with sorting/filtering
  - Interactive D3.js charts (rating trends, problem distribution)
  - Heatmap for submission activity
  - Modal view for detailed user stats
  - Export results to formatted Excel file
- **State Management**:
  - `searchUsername`: Single search input
  - `bulkFile`: Uploaded Excel file
  - `bulkResults`: Array of fetched profiles
  - `progress`: Current processing status
  - `sortConfig`: Table sorting configuration
  - `selectedUser`: User selected for modal view

#### **AuthContext.jsx**
- **Features**:
  - Supabase authentication integration
  - Admin login with localStorage persistence
  - Session management with automatic refresh
  - OTP-based passwordless login
  - Email/password authentication
  - Custom sign-out handling
- **Provides**:
  - `currentUser`: Current authenticated user
  - `session`: Supabase session object
  - `isAdmin`: Admin status flag
  - `signIn()`: Email/password login
  - `signUp()`: User registration
  - `signInWithOtp()`: Send OTP to email
  - `verifyOtp()`: Verify OTP code
  - `adminSignIn()`: Admin authentication
  - `signOut()`: Logout (Supabase or admin)

---

## 🔐 Authentication System

### **Dual Authentication Architecture**

```
┌─────────────────────────────────────────────┐
│          Authentication Layer               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Supabase   │      │  Admin Login    │ │
│  │     Auth     │      │  (Environment)  │ │
│  └──────┬───────┘      └────────┬────────┘ │
│         │                       │          │
│         │                       │          │
│         ▼                       ▼          │
│  ┌──────────────────────────────────────┐  │
│  │       Unified Auth Context           │  │
│  │  • currentUser                       │  │
│  │  • isAdmin                           │  │
│  │  • session                           │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### **Supabase Authentication**

**Features:**
- Email/password registration and login
- OTP-based passwordless authentication
- Email verification
- Session persistence
- Automatic token refresh
- Secure password reset

**Flow:**
1. User clicks "Get Started" or "Sign In"
2. LoginSignup modal opens
3. User enters email/password or requests OTP
4. Supabase validates credentials
5. Session created and stored
6. User redirected to profile/analyzer

### **Admin Authentication**

**Features:**
- Environment-based credentials
- No database dependency
- Instant access for authorized personnel
- localStorage session persistence
- Special admin badge in navbar

**Flow:**
1. User clicks "Authorized Access" button
2. AdminLogin modal opens
3. User enters username and password
4. Validated against `.env` variables
5. Admin session created in localStorage
6. Full platform access granted

**Configuration:**
```env
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=SecurePassword123!
```

**Security Notes:**
- ⚠️ Change default credentials immediately
- ⚠️ Use strong passwords in production
- ⚠️ Consider IP whitelisting for admin access
- ⚠️ Regularly rotate admin credentials

---

## ⚡ Performance Optimization

### **1. Parallel Bulk Processing**

**Problem**: Fetching 100 profiles sequentially takes ~150 seconds
**Solution**: Parallel workers across multiple API endpoints

```
Sequential: 100 users × 1.5s = 150 seconds
Parallel (6 workers): 100 users ÷ 6 × 1.5s = 25 seconds
Speed up: 6x faster! ⚡
```

**Implementation:**
- Split usernames into N batches (N = number of workers)
- Each worker uses a different API endpoint
- Parallel async/await execution
- Progress tracking for each worker
- Error handling with automatic retry

### **2. Connection Pooling**

**LeetCode Backend:**
```javascript
class ConnectionPool {
    constructor(maxConnections = 20) {
        this.agents = [];
        for (let i = 0; i < maxConnections; i++) {
            this.agents.push(new https.Agent({
                keepAlive: true,
                maxSockets: 5,
                maxFreeSockets: 2,
                timeout: 5000
            }));
        }
    }
}
```

**Benefits:**
- Reuse TCP connections
- Reduce handshake overhead
- Handle 50+ concurrent requests
- 30% faster response times

### **3. Caching Strategy**

**TTL Cache Implementation:**
```javascript
class TTLCache {
    constructor(ttl = 300000) { // 5 minutes
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (item && Date.now() < item.expires) {
            return item.value;
        }
        this.cache.delete(key);
        return null;
    }
}
```

**Benefits:**
- Reduce redundant API calls
- Faster response for repeated queries
- Lower backend load
- Configurable TTL per use case

### **4. Code Splitting & Lazy Loading**

```javascript
// Lazy load analyzer components
const CodeChefLoader = lazy(() => import('./components/codechefloder'));
const LeetCodeLoader = lazy(() => import('./components/leetcodeloder'));
const CodeForcesLoader = lazy(() => import('./components/codeforcesloder'));
```

**Results:**
- Initial bundle size: 250KB → 120KB
- Faster first contentful paint
- Progressive loading of features

### **5. Rate Limiting**

**CodeChef Backend:**
```python
def _rate_limit(self):
    delay = random.uniform(self.min_delay, self.max_delay)
    if time_since_last < delay:
        sleep_time = delay - time_since_last
        time.sleep(sleep_time)
```

**CodeForces Backend:**
```javascript
const waitForRateLimit = async () => {
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
};
```

**Benefits:**
- Avoid API bans
- Comply with platform rate limits
- Sustainable long-term usage

---

## 🎨 UI/UX Design

### **Design System**

**Typography:**
- Primary Font: Varela Round (sans-serif, rounded, friendly)
- Secondary Font: Pompiere (cursive, decorative)
- Headings: Bold, gradient text effects
- Body: Clean, readable, high contrast

**Color Palette:**
```css
/* Primary Colors */
--blue: #3B82F6      /* Trust, professionalism */
--purple: #A855F7    /* Innovation, creativity */
--pink: #EC4899      /* Energy, excitement */

/* Platform Colors */
--codechef: #F59E0B  /* Orange/Amber */
--leetcode: #EF4444  /* Red/Orange */
--codeforces: #3B82F6 /* Blue/Indigo */
--hackerrank: #10B981 /* Green/Emerald */

/* Neutrals */
--gray-900: #111827  /* Background */
--gray-800: #1F2937  /* Cards */
--gray-700: #374151  /* Borders */
--white: #FFFFFF     /* Text */
```

**Glass Morphism Effects:**
```css
.glass-card {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
}
```

### **Animations**

**Navbar Dropdowns:**
- Smooth expand/collapse with max-height transition
- Staggered fade-in for menu items
- Hover effects with scale and underline animations

**Platform Cards:**
- Hover scale transform (105%)
- Shadow expansion on hover
- Smooth gradient transitions
- Coming soon badge with pulse animation

**Page Transitions:**
- Fade in on route change
- Smooth scroll to sections
- Loading spinners with custom animations

### **Responsive Design**

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Adaptive Features:**
- Collapsible navbar for mobile
- Horizontal → vertical layout switches
- Touch-optimized buttons (min 44px)
- Hamburger menu with slide animation

---

## 📊 Data Flow

### **Single User Search Flow**

```
┌─────────────────────────────────────────────────────────┐
│ User enters username in search box                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend sends GET request to backend API               │
│ Example: GET /api/codechef?username=chef123            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Backend checks cache (TTL: 5 minutes)                   │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │ Cache Hit?                │
          ├───────────────────────────┤
          │ Yes          │ No         │
          ▼              ▼            │
    ┌──────────┐   ┌────────────────┐│
    │ Return   │   │ Fetch from     ││
    │ Cached   │   │ Platform API   ││
    │ Data     │   │ (Rate Limited) ││
    └────┬─────┘   └────────┬───────┘│
         │                  │         │
         │         ┌────────▼──────┐  │
         │         │ Parse HTML/   │  │
         │         │ JSON Response │  │
         │         └───────┬───────┘  │
         │                 │          │
         │         ┌───────▼───────┐  │
         │         │ Store in      │  │
         │         │ Cache         │  │
         │         └───────┬───────┘  │
         │                 │          │
         └─────────────────┘          │
                        │              │
                        ▼              │
┌─────────────────────────────────────┴───────────────────┐
│ Return JSON response to frontend                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend displays data:                                 │
│ • Profile header with stats                             │
│ • Interactive charts (D3.js)                            │
│ • Submission heatmap                                    │
│ • Problem distribution                                  │
└─────────────────────────────────────────────────────────┘
```

### **Bulk Search Flow**

```
┌─────────────────────────────────────────────────────────┐
│ User uploads Excel file with 100 usernames             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend parses Excel using XLSX library               │
│ Extracts usernames into array: [user1, user2, ...]     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ codechefBulkManager splits usernames into N batches    │
│ N = NUM_WORKERS (default: 6)                           │
│ Batch 1: [user1, user7, user13, ...]                   │
│ Batch 2: [user2, user8, user14, ...]                   │
│ ...                                                     │
│ Batch 6: [user6, user12, user18, ...]                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Launch N parallel workers (Promise.all)                │
└────────┬────────────┬───────────────┬──────────────────┘
         │            │               │
    Worker 1     Worker 2        Worker 6
         │            │               │
         │ API 1      │ API 2         │ API 6
         ▼            ▼               ▼
    ┌────────┐   ┌────────┐      ┌────────┐
    │CodeChef│   │CodeChef│      │CodeChef│
    │Backend │   │Backend │      │Backend │
    │   #1   │   │   #2   │      │   #6   │
    └───┬────┘   └───┬────┘      └───┬────┘
        │            │               │
        │ 1.5s       │ 1.5s          │ 1.5s
        │ delay      │ delay         │ delay
        │            │               │
        ▼            ▼               ▼
    [Result 1]  [Result 2]      [Result 6]
        │            │               │
        └────────────┴───────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Combine all results into single array                  │
│ Update progress: "Fetched 100/100 profiles"            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Display results in sortable table                      │
│ • Filter by name, rating, problems solved               │
│ • Sort by any column                                    │
│ • Export to Excel                                       │
│ • View individual profiles in modal                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Deployment

### **Frontend Deployment (Netlify/Vercel/Render)**

#### **Option 1: Netlify (Recommended)**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
cd Frontend
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

**Configuration:**
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: Add all `VITE_*` variables

**Redirects (`public/_redirects`):**
```
/*    /index.html   200
```

#### **Option 2: Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd Frontend
vercel --prod
```

**Configuration (`vercel.json`):**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### **Option 3: Render**

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy!

### **Backend Deployment (Render)**

#### **CodeChef Backend (Python)**

**Procfile:**
```
web: python sb.py
```

**Render Configuration:**
- Runtime: Python 3.9+
- Build command: `pip install -r requirements.txt`
- Start command: From Procfile
- Environment: Add PORT if needed

#### **LeetCode Backend (Node.js)**

**Procfile:**
```
web: node server.js
```

**Render Configuration:**
- Runtime: Node.js 18+
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

#### **CodeForces Backend (Node.js)**

**Procfile:**
```
web: node server.js
```

**Render Configuration:**
- Runtime: Node.js 18+
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `CODEFORCES_API_KEY`
  - `CODEFORCES_API_SECRET`
  - `PORT`
  - `NODE_ENV=production`

**Deploy using Blueprint (`render.yaml`):**
```bash
# render.yaml already configured
# Just connect repo and deploy!
```

### **Domain Configuration**

**Custom Domain Setup:**
1. Purchase domain (e.g., skillboard.shop)
2. Add domain in hosting provider
3. Configure DNS records:
   - A record: `@` → Netlify IP
   - CNAME: `www` → your-app.netlify.app
4. Enable HTTPS (automatic with Netlify/Vercel)
5. Update `VITE_SUPABASE_SITE_URL` in `.env`

---

## 🧪 Testing

### **Manual Testing Checklist**

#### **Authentication**
- [ ] Sign up with email/password
- [ ] Login with email/password
- [ ] OTP login flow
- [ ] Admin login with credentials
- [ ] Logout (both types)
- [ ] Session persistence on refresh
- [ ] Protected route access control

#### **Navigation**
- [ ] Home page loads correctly
- [ ] Navbar dropdowns work (Services, User)
- [ ] Mobile menu functionality
- [ ] All routes navigate correctly
- [ ] Back button works as expected
- [ ] 404 redirects to home

#### **CodeChef Analyzer**
- [ ] Single user search
- [ ] Valid username returns data
- [ ] Invalid username shows error
- [ ] Bulk Excel upload (.xlsx, .xls, .csv)
- [ ] Progress tracking during bulk search
- [ ] Results table displays correctly
- [ ] Sorting and filtering work
- [ ] Modal opens with user details
- [ ] Export to Excel downloads file
- [ ] Charts render without errors

#### **LeetCode Analyzer**
- [ ] Username search returns profile
- [ ] Problem statistics display
- [ ] Charts render correctly
- [ ] Error handling for invalid users

#### **CodeForces Analyzer**
- [ ] Handle search works
- [ ] Rating history displays
- [ ] Contest data shows correctly
- [ ] Problem stats accurate

#### **Performance**
- [ ] Page load time < 3 seconds
- [ ] Bulk search completes in expected time
- [ ] No memory leaks during long sessions
- [ ] Smooth animations and transitions

### **Browser Compatibility**

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully supported |
| Firefox | 88+ | ✅ Fully supported |
| Safari | 14+ | ✅ Fully supported |
| Edge | 90+ | ✅ Fully supported |
| Opera | 76+ | ✅ Fully supported |

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### **Getting Started**

1. **Fork the Repository**
```bash
git clone https://github.com/your-username/SkillBoard.git
cd SkillBoard
git remote add upstream https://github.com/ayanpandit/SkillBoard.git
```

2. **Create a Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make Your Changes**
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

4. **Commit Your Changes**
```bash
git add .
git commit -m "feat: add amazing feature"
```

**Commit Message Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

5. **Push and Create Pull Request**
```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub!

### **Development Guidelines**

**Code Style:**
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow Tailwind CSS conventions

**Project Structure:**
```
New Component: src/components/YourComponent.jsx
New Utility: src/utils/yourUtility.js
New Context: src/context/YourContext.jsx
```

**Testing:**
- Test on multiple browsers
- Test responsive design
- Test with different data scenarios
- Test error cases

### **Areas to Contribute**

🎨 **UI/UX Improvements**
- Enhance mobile responsiveness
- Add dark/light theme toggle
- Improve loading states
- Add skeleton loaders

⚡ **Performance**
- Optimize bundle size
- Improve caching strategy
- Add service workers
- Implement virtualization for large tables

✨ **Features**
- Add more platforms (HackerRank, AtCoder, TopCoder)
- Advanced filtering options
- Profile comparison tool
- Historical data tracking
- Email reports

📱 **Mobile App**
- React Native version
- PWA enhancements
- Offline support

🔐 **Security**
- Add 2FA
- Implement rate limiting on frontend
- Add CAPTCHA for bulk searches
- Security audit

📚 **Documentation**
- Video tutorials
- API documentation
- Deployment guides
- Troubleshooting section

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Ayan Pandey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Vite** for blazing-fast development experience
- **Supabase** for authentication infrastructure
- **Tailwind CSS** for utility-first styling
- **D3.js** for powerful data visualizations
- **CodeChef, LeetCode, CodeForces** for their platforms

---

## 📞 Contact & Support

### **Developer**
- **Name**: Ayan Pandey
- **Email**: [Contact through GitHub](https://github.com/ayanpandit)
- **LinkedIn**: [Ayan Pandey](https://www.linkedin.com/in/ayan-pandey-b66067296/)
- **Instagram**: [@ayanpandit_31](https://www.instagram.com/ayanpandit_31)

### **Project Links**
- **Live Demo**: [https://skillboard.shop](https://skillboard.shop)
- **GitHub Repository**: [https://github.com/ayanpandit/SkillBoard](https://github.com/ayanpandit/SkillBoard)
- **Issue Tracker**: [GitHub Issues](https://github.com/ayanpandit/SkillBoard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ayanpandit/SkillBoard/discussions)

### **Support the Project**

If you find SkillBoard useful, please consider:
- ⭐ **Starring** the repository
- 🐛 **Reporting bugs** and issues
- 💡 **Suggesting features**
- 🤝 **Contributing** code
- 📢 **Sharing** with others

---

## 🚀 Roadmap

### **Q1 2025**
- [x] Launch CodeChef, LeetCode, and CodeForces analyzers
- [x] Implement bulk search functionality
- [x] Add admin authentication system
- [ ] Mobile app (React Native)
- [ ] Email report generation

### **Q2 2025**
- [ ] Add HackerRank support
- [ ] Implement profile comparison feature
- [ ] Add historical data tracking
- [ ] Advanced analytics dashboard
- [ ] Team/organization accounts

### **Q3 2025**
- [ ] AtCoder integration
- [ ] TopCoder integration
- [ ] AI-powered candidate recommendations
- [ ] Interview scheduling integration
- [ ] Public API for developers

### **Q4 2025**
- [ ] Machine learning-based skill assessment
- [ ] Video tutorials and courses
- [ ] Premium features and subscriptions
- [ ] Mobile app release (iOS & Android)

---

## 📊 Project Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/ayanpandit/SkillBoard?style=social)
![GitHub forks](https://img.shields.io/github/forks/ayanpandit/SkillBoard?style=social)
![GitHub issues](https://img.shields.io/github/issues/ayanpandit/SkillBoard)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ayanpandit/SkillBoard)
![GitHub last commit](https://img.shields.io/github/last-commit/ayanpandit/SkillBoard)

</div>

---

<div align="center">

## 🌟 Built with ❤️ by Ayan Pandey

**SkillBoard** - Making Technical Hiring Data-Driven

[Website](https://skillboard.shop) • [Documentation](#) • [Support](https://github.com/ayanpandit/SkillBoard/issues)

© 2025 SkillBoard. All rights reserved.

</div>
