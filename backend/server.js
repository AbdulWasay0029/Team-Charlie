const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { supabase, isConfigured } = require('./supabaseClient');
const { verifyAndDescribePhoto, draftEscalationMessage, chatWithCivicAssistant } = require('./aiModule');
const { sendWhatsAppAlert } = require('./escalationModule');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].map(url => url ? url.trim().replace(/\/$/, '') : '').filter(Boolean);

console.log('Configured CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const formattedOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(formattedOrigin)) {
      return callback(null, true);
    }
    
    // Hackathon demo safety net: Allow localhost, Vercel preview/prod domains, and Render domains
    if (
      formattedOrigin.startsWith('http://localhost:') || 
      formattedOrigin.startsWith('http://127.0.0.1:') ||
      formattedOrigin.endsWith('.vercel.app') ||
      formattedOrigin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

// --- STATEFUL IN-MEMORY MOCK DATA (Phase 1 Fallback) ---
const mockUsers = [
  { id: '11111111-1111-1111-1111-111111111111', phone: '9999999999', name: 'Sameer Ansari' },
  { id: '22222222-2222-2222-2222-222222222222', phone: '8888888888', name: 'Ravi Kumar' }
];

let mockReports = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    user_id: '11111111-1111-1111-1111-111111111111',
    lat: 17.3850,
    lng: 78.4867,
    category: 'garbage',
    description: 'Overflowing garbage dump obstructing the main market road. Urgent health hazard in Charminar ward.',
    photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18',
    ai_verified: true,
    ai_severity: 5,
    status: 'live',
    priority_score: 24,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    user_id: '22222222-2222-2222-2222-222222222222',
    lat: 17.4060,
    lng: 78.4680,
    category: 'road_damage',
    description: 'Deep pothole cluster on Road No 36 after recent rainfall. Causing severe traffic jams and vehicle damage.',
    photo_url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2',
    ai_verified: true,
    ai_severity: 4,
    status: 'live',
    priority_score: 18,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    user_id: '11111111-1111-1111-1111-111111111111',
    lat: 17.4480,
    lng: 78.3770,
    category: 'open_drain',
    description: 'Uncovered manhole near Mindspace tech park entrance. Severe pedestrian and two-wheeler hazard.',
    photo_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9',
    ai_verified: true,
    ai_severity: 4,
    status: 'live',
    priority_score: 7,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    user_id: '22222222-2222-2222-2222-222222222222',
    lat: 17.4100,
    lng: 78.4500,
    category: 'streetlight',
    description: 'Entire row of streetlights non-functional on necklace road stretch. Creating dark safety hazard at night.',
    photo_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c',
    ai_verified: true,
    ai_severity: 3,
    status: 'in_progress',
    priority_score: 14,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    user_id: '11111111-1111-1111-1111-111111111111',
    lat: 17.4390,
    lng: 78.4740,
    category: 'water_leak',
    description: 'Major pipeline burst wasting clean drinking water and flooding the main road. Fixed by water board.',
    photo_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296',
    ai_verified: true,
    ai_severity: 5,
    status: 'resolved',
    priority_score: 31,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const mockVotes = {
  '10000000-0000-0000-0000-000000000001': new Set(['22222222-2222-2222-2222-222222222222']),
  '10000000-0000-0000-0000-000000000002': new Set(['11111111-1111-1111-1111-111111111111'])
};

const mockNotifications = new Set(); // Stores report_ids that triggered escalation

const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- ENDPOINTS ---

// Root / Health Check
app.get('/', (req, res) => {
  res.json({
    app: "TraceSpark Backend API",
    mode: isConfigured ? "Production (Supabase Connected)" : "Development (Mock Fallback)",
    supabase_configured: isConfigured,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// 0.1 POST /auth/signup
// Body: { name, phone, password, ward }
app.post('/auth/signup', async (req, res) => {
  const { name, phone, password, ward = 'Ward 112 (Hitech City)' } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Name, mobile number, and password are required' });
  }

  if (phone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
  }

  if (isConfigured && supabase) {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this mobile number already exists. Please Sign In.' });
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ name, phone }])
        .select()
        .single();

      if (insertError) throw insertError;
      return res.status(201).json({ ...newUser, verified: true, loginType: 'phone', ward });
    } catch (err) {
      console.error('Supabase error in POST /auth/signup:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    let existingUser = mockUsers.find(u => u.phone === phone);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this mobile number already exists. Please Sign In.' });
    }

    const newUser = {
      id: generateUuid(),
      name,
      phone,
      password,
      verified: true,
      loginType: 'phone',
      ward
    };
    mockUsers.push(newUser);
    return res.status(201).json(newUser);
  }
});

// 0.2 POST /auth/signin
// Body: { phone, password }
app.post('/auth/signin', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Mobile number and password are required' });
  }

  if (isConfigured && supabase) {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existingUser) {
        return res.status(400).json({ error: 'Invalid mobile number or password.' });
      }

      return res.json({ ...existingUser, verified: true, loginType: 'phone' });
    } catch (err) {
      console.error('Supabase error in POST /auth/signin:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    let existingUser = mockUsers.find(u => u.phone === phone);
    if (!existingUser || (existingUser.password && existingUser.password !== password)) {
      return res.status(400).json({ error: 'Invalid mobile number or password.' });
    }

    return res.json({ ...existingUser, verified: true, loginType: 'phone' });
  }
});

// 0.3 POST /auth/google-verify
// Body: { credential, ward }
app.post('/auth/google-verify', async (req, res) => {
  const { credential, ward = 'Ward 112 (Hitech City)' } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required' });
  }

  try {
    let email, name, picture;

    // Verify cryptographic ID token if Client ID is present
    if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('demo')) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name || 'Verified Google Citizen';
      picture = payload.picture;
    } else {
      // Fallback decode if offline / non-strict env
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const parsed = JSON.parse(jsonPayload);
      email = parsed.email;
      name = parsed.name || 'Verified Google Citizen';
      picture = parsed.picture;
    }

    if (!email) {
      return res.status(400).json({ error: 'Unable to extract email from Google token' });
    }

    if (isConfigured && supabase) {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', email)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existingUser) {
        return res.json({ ...existingUser, verified: true, loginType: 'google', email, picture, ward });
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ name, phone: email }])
        .select()
        .single();

      if (insertError) throw insertError;
      return res.status(201).json({ ...newUser, verified: true, loginType: 'google', email, picture, ward });
    } else {
      let existingUser = mockUsers.find(u => u.phone === email || u.email === email);
      if (existingUser) {
        return res.json({ ...existingUser, verified: true, loginType: 'google', email, picture, ward });
      }

      const newUser = {
        id: generateUuid(),
        name,
        phone: email,
        email,
        picture,
        verified: true,
        loginType: 'google',
        ward
      };
      mockUsers.push(newUser);
      return res.status(201).json(newUser);
    }
  } catch (err) {
    console.error('Error verifying Google ID token in POST /auth/google-verify:', err);
    return res.status(401).json({ error: 'Invalid or expired Google token' });
  }
});

// 1. POST /users (Signup)
// Body: { name, phone }
app.post('/users', async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Missing name or phone fields' });
  }

  if (isConfigured && supabase) {
    try {
      // Avoid duplicate users by checking phone first
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existingUser) {
        return res.json({ id: existingUser.id, name: existingUser.name, phone: existingUser.phone });
      }

      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ name, phone }])
        .select()
        .single();

      if (insertError) throw insertError;
      return res.status(201).json({ id: newUser.id, name: newUser.name, phone: newUser.phone });
    } catch (err) {
      console.error('Supabase error in POST /users:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    const existingUser = mockUsers.find(u => u.phone === phone);
    if (existingUser) {
      return res.json(existingUser);
    }

    const newUser = {
      id: generateUuid(),
      name,
      phone
    };
    mockUsers.push(newUser);
    return res.status(201).json(newUser);
  }
});

// 2. POST /reports (Issue Submission + Inline AI Check)
// Body: { user_id, lat, lng, category, photo_url }
app.post('/reports', async (req, res) => {
  const { user_id, lat, lng, category, photo_url } = req.body;

  if (!user_id || lat === undefined || lng === undefined || !category || !photo_url) {
    return res.status(400).json({ error: 'Missing required fields: user_id, lat, lng, category, photo_url' });
  }

  // 1. Run AI Photo Verification INLINE
  console.log(`[AI Module] Inspecting photo for ${category} at ${lat}, ${lng}...`);
  const aiResult = await verifyAndDescribePhoto(photo_url, category);
  
  const status = aiResult.verified ? 'live' : 'rejected';
  const ai_severity = aiResult.severity;
  const description = aiResult.description;
  const ai_verified = aiResult.verified;

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          user_id,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          category,
          photo_url,
          ai_verified,
          ai_severity,
          description,
          status
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (err) {
      console.error('Supabase error in POST /reports:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    const newReport = {
      id: generateUuid(),
      user_id,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      category,
      description,
      photo_url,
      ai_verified,
      ai_severity,
      status,
      priority_score: 0,
      created_at: new Date().toISOString()
    };
    mockReports.push(newReport);
    mockVotes[newReport.id] = new Set();
    
    return res.status(201).json(newReport);
  }
});

// 3. GET /reports (Retrieves live verified reports, with filters and sorts)
// Query params: sort=priority|date, category=xyz
app.get('/reports', async (req, res) => {
  const { sort, category } = req.query;

  if (isConfigured && supabase) {
    try {
      let query = supabase
        .from('reports')
        .select('*, votes(count)')
        .neq('status', 'rejected');

      if (category) {
        query = query.eq('category', category);
      }

      if (sort === 'priority') {
        query = query
          .order('priority_score', { ascending: false })
          .order('created_at', { ascending: false });
      } else {
        // Default sort: date (created_at DESC)
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      const mappedReports = data.map(r => {
        const votesObj = r.votes && r.votes[0];
        const vote_count = votesObj ? votesObj.count : 0;
        const { votes, ...rest } = r;
        return {
          ...rest,
          vote_count
        };
      });

      return res.json(mappedReports);
    } catch (err) {
      console.error('Supabase error in GET /reports:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    let filtered = mockReports.filter(r => r.status !== 'rejected');

    if (category) {
      filtered = filtered.filter(r => r.category && r.category.toLowerCase() === category.toLowerCase());
    }

    const mapped = filtered.map(r => {
      const voteSet = mockVotes[r.id] || new Set();
      return {
        ...r,
        vote_count: voteSet.size
      };
    });

    if (sort === 'priority') {
      mapped.sort((a, b) => {
        if (b.priority_score !== a.priority_score) {
          return b.priority_score - a.priority_score;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
    } else {
      mapped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return res.json(mapped);
  }
});

// 4. POST /reports/:id/vote (Upvote issue + auto-escalation trigger)
// Body: { user_id }
app.post('/reports/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  if (isConfigured && supabase) {
    try {
      // 1. Insert vote. Rely on Postgres unique constraint to prevent double-voting
      const { error: insertError } = await supabase
        .from('votes')
        .insert([{ report_id: id, user_id }]);

      let isNewVote = false;
      if (!insertError) {
        isNewVote = true;
      } else if (insertError.code === '23505') {
        // Unique violation code: user already voted. Handled gracefully.
        isNewVote = false;
      } else {
        throw insertError;
      }

      // 2. Fetch current priority score
      const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      let currentScore = report.priority_score || 0;

      // 3. If it was a new vote, increment the score
      if (isNewVote) {
        currentScore += 1;
        await supabase
          .from('reports')
          .update({ priority_score: currentScore })
          .eq('id', id);
      }

      const crossedEscalationLimit = currentScore >= 25;
      let escalation_fired = false;

      // 4. Trigger Automatic WhatsApp Escalation if crossed limit and not already sent
      if (crossedEscalationLimit) {
        // Check notifications table
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('report_id', id)
          .maybeSingle();

        if (!existingNotification) {
          // Send alert inline
          try {
            const messageText = await draftEscalationMessage({
              category: report.category || 'Civic Issue',
              severity: report.ai_severity || 1,
              voteCount: currentScore,
              lat: report.lat,
              lng: report.lng
            });

            const councillorPhone = process.env.COUNCILLOR_PHONE || '+919999999999';
            await sendWhatsAppAlert(councillorPhone, messageText);

            // Record notification
            await supabase
              .from('notifications')
              .insert([{ report_id: id }]);

            escalation_fired = true;
          } catch (escalationErr) {
            console.error('[Escalation Error] Failed during inline WhatsApp escalation:', escalationErr);
          }
        }
      }

      return res.json({
        priority_score: currentScore,
        escalation_fired,
        isNewVote
      });
    } catch (err) {
      console.error('Supabase error in POST /reports/:id/vote:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    const reportIndex = mockReports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = mockReports[reportIndex];
    if (!mockVotes[id]) {
      mockVotes[id] = new Set();
    }

    const votesSet = mockVotes[id];
    let mockIsNewVote = false;
    if (!votesSet.has(user_id)) {
      votesSet.add(user_id);
      report.priority_score += 1;
      mockIsNewVote = true;
    }

    const crossedEscalationLimit = report.priority_score >= 25;
    let escalation_fired = false;

    // Trigger Mock WhatsApp Escalation if threshold crossed and not already sent
    if (crossedEscalationLimit && mockIsNewVote) {
      if (!mockNotifications.has(id)) {
        mockNotifications.add(id);
        escalation_fired = true;

        draftEscalationMessage({
          category: report.category || 'Civic Issue',
          severity: report.ai_severity || 1,
          voteCount: report.priority_score,
          lat: report.lat,
          lng: report.lng
        }).then(messageText => {
          const councillorPhone = process.env.COUNCILLOR_PHONE || '+919999999999';
          return sendWhatsAppAlert(councillorPhone, messageText);
        }).catch(err => {
          console.error('Error during mock WhatsApp escalation:', err);
        });
      }
    }

    return res.json({
      priority_score: report.priority_score,
      escalation_fired,
      isNewVote: mockIsNewVote
    });
  }
});

// 4.1 GET /users/:userId/votes (Retrieve report IDs the user has upvoted)
app.get('/users/:userId/votes', async (req, res) => {
  const { userId } = req.params;

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('report_id')
        .eq('user_id', userId);

      if (error) throw error;
      return res.json(data.map(v => v.report_id));
    } catch (err) {
      console.error('Supabase error in GET /users/:userId/votes:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.json([]);
  }
});

// 5. POST /chat
// Body: { message, context }
app.post('/chat', async (req, res) => {
  const { message, context = {} } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const aiResponse = await chatWithCivicAssistant(message, context);
    if (aiResponse) {
      return res.json({ reply: aiResponse });
    } else {
      return res.status(503).json({ error: 'AI LLM unavailable, use client fallback' });
    }
  } catch (err) {
    console.error('Error in POST /chat:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`TraceSpark backend server listening on port ${PORT}`);
});
