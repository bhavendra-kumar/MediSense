# MediSense AI - AI-Powered Health Analysis Platform
A comprehensive full-stack web application for medical report analysis, skin disease detection, and AI-powered health guidance with multilingual support for Indian users.

## 🌟 Features

### 1. **Medical Report Analyzer**
- Upload and analyze PDF medical reports and images
- OCR extraction in 11 Indian languages (Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, Punjabi, Gujarati, Marathi, Odia, English)
- Extract test names, values, normal ranges
- AI-powered simplified medical summaries
- Highlight abnormal values with severity indicators
- Personalized health recommendations

### 2. **Dermatology Analyzer**
- Upload skin images for analysis
- AI-powered skin disease detection
- Confidence scores and severity assessment
- Personalized care suggestions
- Doctor review and verification system

### 3. **AI Health Chat Assistant**
- Chat-based medical inquiries
- Voice input support (Speech-to-Text)
- Voice output support (Text-to-Speech)
- Multilingual responses in user's preferred language
- Conversation history tracking

### 4. **Multilingual Support**
- 11 Indian languages support
- Auto-language detection
- UI translation using react-i18next
- Language-specific AI responses

### 5. **Health Timeline & Analytics**
- Store and track lab values over time
- Health trend visualization
- Anomaly detection and alerts
- Comparative analysis

### 6. **Doctor Review Panel**
- Doctor login and role-based access
- Review patient reports
- Add professional notes
- Send recommendations

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer
- **OCR**: Tesseract.js, pdfjs-dist
- **Language Detection**: franc
- **AI Integration**: OpenAI GPT API
- **Testing**: Ready for Jest/Mocha

### Frontend
- **Library**: React 19
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **State Management**: React Context + React Query
- **Internationalization**: react-i18next
- **Routing**: React Router v6
- **Charts**: Chart.js, react-chartjs-2

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB Atlas or local MongoDB
- OpenAI API Key (optional, for AI features)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/MediSense
   JWT_SECRET=your-secure-secret-key
   OPENAI_API_KEY=sk-your-openai-key
   UPLOAD_DIR=uploads
   NODE_ENV=development
   ```

4. **Create uploads directory**
   ```bash
   mkdir uploads
   ```

5. **Start the server**
   ```bash
   # Development with hot reload
   npm run dev

   # Production
   npm start
   ```

   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:5173`

## 📁 Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/           # Route handlers
│   │   ├── authController.js
│   │   ├── reportController.js
│   │   ├── dermController.js
│   │   └── aiController.js
│   ├── models/                # MongoDB schemas
│   │   ├── User.js
│   │   ├── Report.js
│   │   ├── Analysis.js
│   │   └── DermReport.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── dermRoutes.js
│   │   ├── aiRoutes.js
│   │   └── index.js
│   ├── services/              # Business logic
│   │   ├── ocrService.js
│   │   ├── llmService.js
│   │   └── dermService.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   └── utils/
│       └── logger.js
├── uploads/                   # File storage
├── package.json
└── .env
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/            # Reusable components
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/                 # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Dashboard.jsx
│   ├── services/              # API services
│   │   ├── api.js             # Axios instance
│   │   ├── authService.js
│   │   ├── reportService.js
│   │   ├── dermService.js
│   │   └── aiService.js
│   ├── context/               # React Context
│   │   └── AuthContext.jsx
│   ├── hooks/                 # Custom hooks
│   ├── locales/               # i18n translations
│   │   ├── en.json
│   │   ├── hi.json
│   │   └── ...
│   ├── utils/                 # Utility functions
│   ├── App.jsx
│   ├── main.jsx
│   ├── i18n.js
│   └── index.css
├── .env
├── package.json
└── vite.config.js
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Medical Reports
- `POST /api/reports/upload` - Upload report
- `POST /api/reports/:reportId/ocr` - Perform OCR
- `POST /api/reports/:reportId/analyze` - Analyze report
- `GET /api/reports/user/:userId` - Get user's reports
- `GET /api/reports/:reportId` - Get specific report
- `DELETE /api/reports/:reportId` - Delete report

### Dermatology
- `POST /api/derm/upload` - Upload skin image
- `POST /api/derm/:reportId/analyze` - Analyze image
- `GET /api/derm/user/:userId` - Get user's analyses
- `GET /api/derm/:reportId` - Get specific analysis
- `PUT /api/derm/:reportId` - Update by doctor
- `DELETE /api/derm/:reportId` - Delete analysis

### AI/Chat
- `POST /api/ai/chat` - Send chat message
- `GET /api/ai/chat/history` - Get chat history
- `DELETE /api/ai/chat/history` - Clear chat
- `POST /api/ai/health-report` - Generate health report
- `POST /api/ai/summarize` - Summarize health data
- `GET /api/ai/health-tips` - Get health tips
- `POST /api/ai/stt` - Speech to text
- `POST /api/ai/tts` - Text to speech

## 📊 Database Models

### User
```javascript
{
  firstName, lastName, email, password,
  phone, dateOfBirth, gender,
  preferredLanguage, role (patient/doctor),
  doctorSpecialization, licenseNumber,
  profileImage, isActive, lastLogin
}
```

### Report
```javascript
{
  userId, fileName, fileUrl, fileType,
  uploadedAt, detectedLanguage, userLanguage,
  reportDate, hospital, doctor,
  isProcessed, processingStatus, rawOCRText
}
```

### Analysis
```javascript
{
  reportId, userId, testName, testValue, unit,
  normalRange, status, interpretation, aiSummary,
  keyFindings, recommendedTests,
  doctorNotes, doctorId, isVerified, verifiedAt
}
```

### DermReport
```javascript
{
  userId, imageUrl, fileName, uploadedAt,
  bodyPart, userDescription, userLanguage,
  diseaseDetected, conditions, aiExplanation,
  careSuggestions, urgencyLevel, recommendedSpecialist,
  doctorId, doctorNotes, doctorVerification
}
```

## 🔐 Authentication

- **JWT-based authentication** with Bearer tokens
- **Password hashing** using bcryptjs (10 salt rounds)
- **Role-based access control** (Patient/Doctor)
- **Token expiration**: 7 days

## 🌐 Supported Languages

1. English (en)
2. Hindi (hi)
3. Tamil (ta)
4. Telugu (te)
5. Bengali (bn)
6. Kannada (kn)
7. Malayalam (ml)
8. Punjabi (pa)
9. Gujarati (gu)
10. Marathi (mr)
11. Odia (or)

## 📝 Environment Variables

### Backend
```
PORT - Server port (default: 5000)
MONGO_URI - MongoDB connection string
JWT_SECRET - JWT signing secret
OPENAI_API_KEY - OpenAI API key
UPLOAD_DIR - File upload directory (default: uploads)
NODE_ENV - Environment (development/production)
```

### Frontend
```
VITE_API_URL - Backend API base URL
```

## 🧪 Testing & Validation

### Backend
- Models have validation rules
- Error handling middleware
- Async/await for all operations
- Comprehensive logging

### Frontend
- Form validation
- Error boundaries
- Loading states
- Toast notifications (ready to implement)

## 🔄 Workflow Examples

### Medical Report Analysis
1. Patient uploads PDF/image
2. OCR extracts text with language detection
3. Report data parsed and stored
4. AI generates medical summary
5. Abnormal values highlighted
6. Health recommendations provided
7. Doctor can review and add notes

### Dermatology Analysis
1. Patient uploads skin image
2. AI analyzes image for skin conditions
3. Provides condition names with confidence scores
4. Generates care suggestions
5. Doctor can verify findings
6. History tracked for trends

### AI Chat
1. User sends health question in their language
2. AI processes and generates response
3. Response provided in user's preferred language
4. Chat history maintained
5. Optional voice input/output

## 🚧 Future Enhancements

- [ ] Real-time doctor notifications
- [ ] Video consultation integration
- [ ] Prescription management
- [ ] Pharmacy integration
- [ ] Insurance claim support
- [ ] Advanced health analytics dashboard
- [ ] Mobile app (React Native/Flutter)
- [ ] Push notifications
- [ ] Email reminders
- [ ] Wearable device integration
- [ ] Blockchain for medical records
- [ ] Payment gateway integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License - see LICENSE file for details.

## 📞 Support

For issues and questions:
- Open GitHub Issues
- Contact: support@medisenseai.com

## 👥 Authors

- Created as part of MediSense AI initiative
- Multilingual health tech for India

---

**Made with ❤️ for better health outcomes**
