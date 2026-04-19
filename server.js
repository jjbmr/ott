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

// API Endpoints: Sports
app.get('/api/sports', async (req, res) => {
  const snapshot = await rtdb.ref('sports').once('value');
  const data = snapshot.val() || {};
  res.json(Object.values(data));
});

app.post('/api/sports', authenticate, async (req, res) => {
  const { id, name, icon, active } = req.body;
  await rtdb.ref(`sports/${id}`).set({ id, name, icon, active });
  res.json({ success: true });
});

app.delete('/api/sports/:id', authenticate, async (req, res) => {
  await rtdb.ref(`sports/${req.params.id}`).remove();
  res.json({ success: true });
});

// API Endpoints: Standings
app.get('/api/standings', async (req, res) => {
  const snapshot = await rtdb.ref('standings').once('value');
  const data = snapshot.val() || {};
  res.json(Object.values(data));
});

app.post('/api/standings', authenticate, async (req, res) => {
  const { id, tournamentId, teamName, played, won, lost, nrr, points } = req.body;
  await rtdb.ref(`standings/${id}`).set({ id, tournamentId, teamName, played, won, lost, nrr, points });
  res.json({ success: true });
});

app.delete('/api/standings/:id', authenticate, async (req, res) => {
  await rtdb.ref(`standings/${req.params.id}`).remove();
  res.json({ success: true });
});

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

// API Endpoints: Notifications
app.post('/api/notifications/send-all', authenticate, async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ success: false, message: 'Title and Body required' });
  }

  try {
    // Get all user tokens from DB
    const usersSnapshot = await rtdb.ref('users').once('value');
    const users = usersSnapshot.val() || {};
    const tokens = [];
    
    for (const uid in users) {
      if (users[uid].fcmToken) {
        tokens.push(users[uid].fcmToken);
      }
    }

    if (tokens.length === 0) {
      return res.json({ success: true, message: 'No tokens found to notify' });
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: [...new Set(tokens)], // Deduplicate tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} messages were sent successfully`);

    // Optionally cleanup invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log('Failed tokens:', failedTokens);
    }

    res.json({ success: true, count: response.successCount });
  } catch (error) {
    console.error('Error sending multi-cast message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
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
