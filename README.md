# 🚀 SkillBoard - Coding Profile Analysis Platform

**SkillBoard** is a comprehensive technical hiring platform that helps recruiters and hiring teams analyze competitive programming profiles from platforms like CodeChef, LeetCode, and Codeforces to make data-driven hiring decisions.

![SkillBoard Banner](Frontend/public/logo.png)

## 🌟 Features

### 🔍 **Multi-Platform Analysis**
- **CodeChef Profile Analyzer**: Detailed analysis of competitive programming skills, contest participation, and star ratings
- **LeetCode Profile Analyzer**: Comprehensive metrics on problem-solving abilities, algorithm proficiency, and coding patterns
- **Codeforces Profile Analyzer**: Performance tracking, rating analysis, and contest participation metrics

### 📊 **Comprehensive Metrics**
- **Problem-solving Statistics**: Difficulty-wise breakdown (Easy/Medium/Hard)
- **Contest Performance**: Participation rates, rankings, and performance trends
- **Activity Heatmaps**: Visual representation of coding activity over time
- **Language Proficiency**: Programming languages used and problem distribution
- **Badge System**: Achievement tracking and skill level assessment

### 🎯 **Hiring-Focused Features**
- **Bulk Profile Analysis**: Upload CSV files to analyze multiple candidates simultaneously
- **Advanced Filtering**: Filter candidates by various criteria (rating, problems solved, etc.)
- **Export Functionality**: Download analysis results in Excel format
- **Real-time Processing**: Live progress tracking for bulk operations
- **Secure Authentication**: User account management with Supabase integration

### 🔐 **Security & Performance**
- **JWT-based Authentication**: Secure user sessions with Supabase
- **Rate Limiting**: Optimized API calls to prevent abuse
- **Caching System**: Efficient data retrieval with TTL-based caching
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with Hooks and Context API
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router Dom** - Client-side routing
- **Axios** - HTTP client for API requests
- **Lucide React** - Beautiful icon library
- **XLSX** - Excel file processing
- **D3.js** - Data visualization for heatmaps

### Backend
- **Node.js & Express** - High-performance server architecture
- **Worker Threads** - Multi-threaded processing for bulk operations
- **GraphQL Integration** - Efficient data fetching from LeetCode API
- **Connection Pooling** - Optimized HTTP connections
- **PM2 Ready** - Production process management

### Database & Authentication
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **JWT Authentication** - Secure token-based auth
- **Real-time subscriptions** - Live data updates

### Deployment & DevOps
- **Render** - Cloud hosting platform
- **Vercel/Netlify Ready** - Frontend deployment options
- **Railway Integration** - Alternative deployment platform
- **Docker Support** - Containerized deployment
- **Environment Variables** - Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/ayanpandit/SkillBoard.git
cd SkillBoard
```

2. **Install Frontend Dependencies**
```bash
cd Frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../backend/leetcodebackend
npm install
```

4. **Environment Setup**

Create `.env` files in both frontend and backend directories:

**Frontend (.env)**
```env
VITE_API_URL_PROD=https://your-production-api.com
VITE_API_URL_DEV=http://localhost:3000
VITE_API_BULK_URL_PROD=https://your-production-api.com/bulk
VITE_API_BULK_URL_DEV=http://localhost:3000/bulk
```

**Backend (.env)**
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

5. **Supabase Configuration**

Update `Frontend/src/supabaseClient.js` with your Supabase credentials:
```javascript
const supabaseUrl = 'your-supabase-url'
const supabaseAnonKey = 'your-supabase-anon-key'
```

### 🏃‍♂️ Running the Application

1. **Start the Backend Server**
```bash
cd backend/leetcodebackend
npm run dev
```

2. **Start the Frontend Development Server**
```bash
cd Frontend
npm run dev
```

3. **Access the Application**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## 📁 Project Structure

```
SkillBoard/
├── Frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Home.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── LoginSignup.jsx
│   │   │   ├── CodeChefProfileAnalyzer.jsx
│   │   │   ├── LeetCodeProfileAnalyzer.jsx
│   │   │   └── CodeForcesProfileAnalyzer.jsx
│   │   ├── context/         # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── assets/          # Images and static files
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Backend services
│   └── leetcodebackend/     # LeetCode API service
│       ├── server.js        # Main server file
│       └── package.json
└── README.md
```

## 🎨 Features Deep Dive

### 🔍 Profile Analysis
- **Real-time Data Fetching**: Direct integration with platform APIs
- **Comprehensive Metrics**: Problem-solving patterns, contest performance, skill assessment
- **Visual Representations**: Heatmaps, charts, and progress indicators
- **Error Handling**: Graceful handling of profile errors and edge cases

### 📈 Bulk Processing
- **CSV Upload**: Support for large candidate lists
- **Progress Tracking**: Real-time processing updates
- **Concurrent Processing**: Multi-threaded backend for faster results
- **Export Options**: Download results in multiple formats

### 🔐 User Management
- **Secure Authentication**: Email/password and OTP login options
- **Profile Management**: User dashboard and settings
- **Session Persistence**: Automatic login state management
- **Protected Routes**: Role-based access control

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the project**
```bash
cd Frontend
npm run build
```

2. **Deploy to Vercel**
```bash
vercel --prod
```

3. **Deploy to Netlify**
```bash
npm run deploy
```

### Backend Deployment (Render)

1. **Connect your GitHub repository to Render**
2. **Set environment variables**
3. **Deploy with auto-deploy enabled**

### Environment Variables for Production

**Frontend Production Environment**
```env
VITE_API_URL_PROD=https://your-backend.onrender.com
VITE_API_BULK_URL_PROD=https://your-backend.onrender.com/bulk
```

**Backend Production Environment**
```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend.vercel.app
```

## 📊 API Documentation

### Core Endpoints

#### LeetCode API
- `GET /api/leetcode/:username` - Get user profile data
- `POST /api/leetcode/bulk` - Process multiple users

#### CodeChef API
- `GET /api/codechef/:username` - Get user profile data
- `POST /api/codechef/bulk` - Process multiple users

#### Codeforces API
- `GET /api/codeforces/:username` - Get user profile data
- `POST /api/codeforces/bulk` - Process multiple users

### Response Format
```json
{
  "username": "example_user",
  "profile": {
    "realName": "John Doe",
    "ranking": 12345,
    "location": "India"
  },
  "stats": {
    "Easy": { "solved": 150, "total": 200 },
    "Medium": { "solved": 100, "total": 300 },
    "Hard": { "solved": 50, "total": 150 }
  },
  "activity": {
    "totalActiveDays": 365,
    "streak": 30
  }
}
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```
3. **Commit your changes**
```bash
git commit -m 'Add amazing feature'
```
4. **Push to the branch**
```bash
git push origin feature/amazing-feature
```
5. **Open a Pull Request**

### 🛠️ Development Guidelines

- Follow React best practices and hooks patterns
- Use Tailwind CSS for styling
- Implement proper error handling
- Add meaningful comments to complex logic
- Ensure responsive design compatibility
- Test thoroughly across different platforms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Ayan Pandit** - Full Stack Developer
- **GitHub**: [@ayanpandit](https://github.com/ayanpandit)

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Supabase** for the backend infrastructure
- **LeetCode, CodeChef, Codeforces** for providing public APIs
- **Open Source Community** for continuous inspiration

## 📞 Support

For support, email ayanpandit.dev@gmail.com or create an issue in the GitHub repository.

## 🔗 Links

- **Live Demo**: [https://skillboard.shop](https://skillboard.shop)
- **GitHub Repository**: [https://github.com/ayanpandit/SkillBoard](https://github.com/ayanpandit/SkillBoard)
- **Documentation**: [Wiki](https://github.com/ayanpandit/SkillBoard/wiki)

---

**Made with ❤️ for the developer community**

*Simplifying technical hiring through data-driven insights*