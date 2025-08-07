#!/usr/bin/env node

// Demo configuration
const DEMO_CONFIG = {
  coach: {
    email: 'coach@eliteskating.com',
    password: 'CoachTest123!',
    full_name: 'Elite Skating Coach',
    organization: 'Elite Skating Academy'
  },
  students: [
    { name: 'Alex Johnson', age: 14, level: 'Intermediate', username: 'alex.johnson' },
    { name: 'Maria Rodriguez', age: 12, level: 'Beginner', username: 'maria.rodriguez' },
    { name: 'Jamie Chen', age: 16, level: 'Advanced', username: 'jamie.chen' },
    { name: 'Taylor Swift', age: 13, level: 'Beginner', username: 'taylor.swift' }
  ]
};

function displayDemoInstructions() {
  console.log('🎬 Eleve Coach Recording Demo');
  console.log('============================\n');

  console.log('🎯 Quick Demo Steps:');
  console.log('===================');
  console.log('1. Run: npm start (or expo start)');
  console.log('2. Open the app in your simulator/device');
  console.log('3. Navigate to Login screen');
  console.log('4. Toggle to "Admin/Coach" mode');
  console.log(`5. Login with: ${DEMO_CONFIG.coach.email}`);
  console.log(`6. Password: ${DEMO_CONFIG.coach.password}`);
  console.log('7. You\'ll see the CoachHomeScreen with recording options');

  console.log('\n📱 Available Demo Students:');
  DEMO_CONFIG.students.forEach((student, index) => {
    console.log(`   ${index + 1}. ${student.name} (${student.age}, ${student.level})`);
  });

  console.log('\n🎬 Recording Options to Try:');
  console.log('============================');
  console.log('');
  console.log('📹 Option 1: Quick Video Recording');
  console.log('  → Tap "Record a Quick Video"');
  console.log('  → Record a 10-second video');
  console.log('  → Select students from the list');
  console.log('  → Choose trick type (Ollie, Kickflip, etc.)');
  console.log('  → Mark if landed or missed');
  console.log('  → Add voice notes or text comments');
  console.log('  → Save the video');
  console.log('');
  console.log('🎯 Option 2: Session Recording');
  console.log('  → Tap "Start a Session"');
  console.log('  → Select environment (Indoor/Outdoor/Park)');
  console.log('  → Choose session students');
  console.log('  → Record multiple videos in the session');
  console.log('  → Each video gets individual review');
  console.log('  → End session with upload options');

  console.log('\n🛠 Key Features to Demo:');
  console.log('========================');
  console.log('✅ Full-screen camera with controls');
  console.log('✅ Front/back camera toggle');
  console.log('✅ Pinch-to-zoom gestures');
  console.log('✅ Recording timer (60-second max)');
  console.log('✅ Student selection overlay');
  console.log('✅ Video playback and review');
  console.log('✅ Trick categorization');
  console.log('✅ Voice notes recording');
  console.log('✅ Session management');
  console.log('✅ Upload progress simulation');
  console.log('✅ Offline capability');

  console.log('\n🎪 Demo Tips:');
  console.log('=============');
  console.log('• Start with Quick Video for immediate impact');
  console.log('• Show student selection - highlight multi-student capability');
  console.log('• Demonstrate voice notes - unique coaching feature');
  console.log('• Try Session mode for structured coaching demo');
  console.log('• Show offline mode - works without internet');
  console.log('• Test camera controls - zoom, flip, timer');

  console.log('\n🚀 Ready to Demo!');
  console.log('================');
  console.log('The recording system is fully functional and ready.');
  console.log('All features work in the current codebase.');
  console.log('Just run the app and login as a coach!');
  console.log('');
  console.log('📖 For detailed guide: see COACH_RECORDING_DEMO.md');
  console.log('🛠 For database setup: see scripts/create-coach-account.sql');
  console.log('');
  console.log('Happy coaching! 🛹🎬');
}

// Run the demo instructions
displayDemoInstructions(); 