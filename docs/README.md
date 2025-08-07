# Eleve - Action Sports Academy App

## Phase 1 Implementation (Coach Functionality)

Eleve is a React Native + Expo + TypeScript app designed for action sports academies like skateboarding schools. This Phase 1 implementation focuses on core coach functionality.

### Features Implemented

#### 🏠 Home Screen
- Clean, modern UI with skateboarding academy branding
- Quick access to video recording
- Statistics overview (students, videos)
- Intuitive navigation to camera functionality

#### 📱 Camera Screen
- Full-screen camera interface with video recording
- Front/back camera toggle
- Recording timer with visual indicator
- 1-minute maximum recording duration
- Smooth navigation between screens

#### 🎬 Video Review Screen
- Video playback with custom controls
- Student tagging system with mock data
- Visual student selector with level badges
- Optional note/feedback input
- Form validation and submission simulation

#### 👥 Student Management
- Mock student data with 8 sample students
- Student levels: Beginner, Intermediate, Advanced
- Color-coded level badges
- Multi-select student tagging

### Technical Implementation

#### 📁 Project Structure
```
/
├── screens/           # Main app screens
│   ├── HomeScreen.tsx
│   ├── CameraScreen.tsx
│   └── VideoReviewScreen.tsx
├── components/        # Reusable UI components
│   └── StudentSelector.tsx
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   ├── constants.ts
│   └── videoUtils.ts
├── mock/             # Mock data
│   └── students.ts
└── App.tsx           # Main app with navigation
```

#### 🛠 Dependencies
- **React Navigation**: Stack navigation between screens
- **Expo Camera**: Video recording functionality
- **Expo AV**: Video playback and controls
- **Expo Media Library**: Future video storage capabilities
- **TypeScript**: Type safety and better developer experience

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Use Expo Go app or simulator to test the app

### Permissions Required
- Camera access for video recording
- Microphone access for audio recording
- Media library access for video storage (future use)

### User Flow

1. **Home Screen**: Coach sees overview and taps "Record Video"
2. **Camera Screen**: Coach records a video of student practice
3. **Video Review Screen**: Coach reviews video, selects students, adds notes
4. **Submission**: Data is simulated to be stored (ready for Phase 2 integration)

### Next Steps (Phase 2)

- Authentication system
- Supabase integration for data storage
- Video upload to cloud storage
- Student progress tracking
- Parent/student access
- Advanced analytics

### Development Notes

- All screens are fully responsive
- Modern UI/UX with consistent styling
- Error handling for camera permissions
- Form validation for required fields
- Smooth animations and transitions
- Ready for integration with backend services

The app is now ready for Phase 2 implementation with authentication and cloud storage integration.
