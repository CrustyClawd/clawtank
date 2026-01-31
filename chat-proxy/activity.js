// Activity state management for Crusty
// Tracks what he's currently doing and where he should be

const fs = require('fs');
const path = require('path');

const ACTIVITY_FILE = '/tmp/crusty-activity.json';

// Activity positions in the tank
const POSITIONS = {
  idle: { x: 0, z: 0, name: 'center' },
  email: { x: -2, z: -1.5, name: 'back-left' },      // Reading email
  twitter: { x: 2, z: -1.5, name: 'back-right' },    // Tweeting
  moltbook: { x: -2, z: 1.5, name: 'front-left' },   // Moltbook
  github: { x: 2, z: 1.5, name: 'front-right' },     // Working on GitHub
};

// Default activity
const DEFAULT_ACTIVITY = {
  current: 'idle',
  position: POSITIONS.idle,
  description: 'Chilling in the tank',
  startedAt: new Date().toISOString(),
  history: []
};

function getActivity() {
  try {
    if (fs.existsSync(ACTIVITY_FILE)) {
      const data = fs.readFileSync(ACTIVITY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading activity:', e.message);
  }
  return DEFAULT_ACTIVITY;
}

function setActivity(activity, description) {
  const current = getActivity();
  const newActivity = {
    current: activity,
    position: POSITIONS[activity] || POSITIONS.idle,
    description: description || `Doing ${activity}`,
    startedAt: new Date().toISOString(),
    history: [
      { activity: current.current, description: current.description, endedAt: new Date().toISOString() },
      ...current.history.slice(0, 19) // Keep last 20
    ]
  };

  try {
    fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(newActivity, null, 2));
  } catch (e) {
    console.error('Error writing activity:', e.message);
  }

  return newActivity;
}

function clearActivity() {
  return setActivity('idle', 'Back to chilling');
}

module.exports = {
  POSITIONS,
  getActivity,
  setActivity,
  clearActivity
};
