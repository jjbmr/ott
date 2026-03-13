import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'firebase-service-account.json'), 'utf8')
    );
  }
} catch (error) {
  console.warn('Warning: firebase-service-account.json not found and FIREBASE_SERVICE_ACCOUNT env var not set. Backend API will be limited.');
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://jbmrsportslive-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const rtdb = serviceAccount ? admin.database() : null;
const adminAuth = serviceAccount ? admin.auth() : null;

// List of admin emails
const ADMIN_EMAILS = [
  'jbmrsports@gmail.com',
];

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
    // Admin check
    if (!ADMIN_EMAILS.includes(decodedToken.email)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Seed Initial Professional Demo Data
const seedData = async () => {
  if (!rtdb) {
    console.log('Skipping seedData: Firebase Admin not initialized.');
    return;
  }
  const tSnapshot = await rtdb.ref('tournaments').once('value');
  const mSnapshot = await rtdb.ref('matches').once('value');
  
  if (!tSnapshot.exists()) {
    console.log('Seeding tournaments to Firebase...');
    const tournaments = {
      't1': { id: 't1', name: 'IPL', year: '2024' },
      't2': { id: 't2', name: 'ICC World Cup', year: '2023' },
      't3': { id: 't3', name: 'Asia Cup', year: '2023' }
    };
    await rtdb.ref('tournaments').set(tournaments);
  }

  if (!mSnapshot.exists()) {
    console.log('Seeding matches to Firebase...');
    const matches = {
      'm1': {
        id: 'm1',
        title: 'KKR vs SRH - IPL 2024 Final Highlights',
        tournamentId: 't1',
        thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=1920',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: '15:20',
        date: 'Recent',
        description: 'KKR clinches their third title with a dominant performance against SRH in the final.',
        featured: 1
      },
      'm2': {
        id: 'm2',
        title: 'India vs Australia - World Cup Final',
        tournamentId: 't2',
        thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1920',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: '22:45',
        date: 'Nov 2023',
        description: 'Australia clinches their 6th World Cup title in a high-stakes final against India.',
        featured: 0
      },
      'm3': {
        id: 'm3',
        title: 'India vs Pakistan - Asia Cup Final',
        tournamentId: 't3',
        thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=1920',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: '12:45',
        date: 'Sept 2023',
        description: 'A clinical performance by India to lift the Asia Cup trophy.',
        featured: 0
      }
    };
    await rtdb.ref('matches').set(matches);
  }
  
  if (!tSnapshot.exists() || !mSnapshot.exists()) {
    console.log('Seeding completed.');
  }
};

seedData();

// API Endpoints: Tournaments
app.get('/api/tournaments', async (req, res) => {
  const snapshot = await rtdb.ref('tournaments').once('value');
  const data = snapshot.val() || {};
  res.json(Object.values(data));
});

app.post('/api/tournaments', authenticate, async (req, res) => {
  try {
    const { id, name, year } = req.body;
    console.log('Creating tournament:', { id, name, year });
    await rtdb.ref(`tournaments/${id}`).set({ id, name, year });
    console.log('Tournament created successfully in Firebase');
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/tournaments/:id', authenticate, async (req, res) => {
  await rtdb.ref(`tournaments/${req.params.id}`).remove();
  // Also delete matches belonging to this tournament
  const matchesSnapshot = await rtdb.ref('matches').once('value');
  const matches = matchesSnapshot.val() || {};
  for (const matchId in matches) {
    if (matches[matchId].tournamentId === req.params.id) {
      await rtdb.ref(`matches/${matchId}`).remove();
    }
  }
  res.json({ success: true });
});

// API Endpoints: Matches
app.get('/api/matches', async (req, res) => {
  const snapshot = await rtdb.ref('matches').once('value');
  const data = snapshot.val() || {};
  res.json(Object.values(data));
});

app.post('/api/matches', authenticate, async (req, res) => {
  const { id, title, sport, tournamentId, thumbnail, videoUrl, duration, date, description, featured } = req.body;
  await rtdb.ref(`matches/${id}`).set({
    id, title, sport, tournamentId, thumbnail, videoUrl, duration, date, description, featured: featured ? 1 : 0
  });
  res.json({ success: true });
});

app.delete('/api/matches/:id', authenticate, async (req, res) => {
  await rtdb.ref(`matches/${req.params.id}`).remove();
  res.json({ success: true });
});

// Admin Auth & Role Management
app.post('/api/login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: 'ID Token required' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    
    console.log(`User attempting login: ${email} (${uid})`);

    // Check or set admin role for specific email
    const userRef = rtdb.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();

    // FORCE ADMIN ROLE for jbmrsports@gmail.com
    if (email === 'jbmrsports@gmail.com') {
      console.log(`Granting admin role to ${email}`);
      await userRef.update({ 
        email,
        role: 'admin',
        lastLogin: new Date().toISOString()
      });
      return res.json({ success: true, user: { ...decodedToken, role: 'admin' } });
    }

    if (!userData) {
      // Default new users to 'user' role
      await userRef.set({
        email,
        role: 'user',
        lastLogin: new Date().toISOString()
      });
      return res.json({ success: true, user: { ...decodedToken, role: 'user' } });
    }

    res.json({ success: true, user: { ...decodedToken, role: userData.role } });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ success: false, message: 'Invalid ID Token' });
  }
});

// Static Files & Frontend Routing
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) return res.status(404).json({ success: false, message: 'API endpoint not found' });
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
