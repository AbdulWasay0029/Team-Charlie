const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { supabase, isConfigured } = require('./supabaseClient');
const { draftEscalationMessage } = require('./aiModule');
const { sendWhatsAppAlert } = require('./escalationModule');

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
    
    if (formattedOrigin.startsWith('http://localhost:') || formattedOrigin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

// --- STATEFUL IN-MEMORY MOCK DATA (Phase 1 Fallback) ---
const users = [
  { id: '11111111-1111-1111-1111-111111111111', phone: '9999999999', name: 'Sameer Ansar', ward: 'Khairatabad', role: 'citizen' },
  { id: '22222222-2222-2222-2222-222222222222', phone: '8888888888', name: 'Official Khairatabad', ward: 'Khairatabad', role: 'official' },
  { id: '33333333-3333-3333-3333-333333333333', phone: '7777777777', name: 'Ravi Kumar', ward: 'Ameerpet', role: 'citizen' }
];

let reports = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    user_id: '11111111-1111-1111-1111-111111111111',
    lat: 17.3850,
    lng: 78.4867,
    category: 'Garbage',
    description: 'Heavy pile of dump lying on road near the main market square.',
    photo_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9',
    ai_verified: true,
    ai_severity: 4,
    ai_issue_type: 'Solid Waste',
    status: 'live',
    priority_score: 10,
    ward: 'Khairatabad',
    resolution_photo_url: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    user_id: '33333333-3333-3333-3333-333333333333',
    lat: 17.4060,
    lng: 78.4680,
    category: 'Pothole',
    description: 'Huge pothole near primary school gate.',
    photo_url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2',
    ai_verified: true,
    ai_severity: 5,
    ai_issue_type: 'Road Damage',
    status: 'in_progress',
    priority_score: 24,
    ward: 'Ameerpet',
    resolution_photo_url: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const reportVotes = {
  '10000000-0000-0000-0000-000000000001': new Set(['33333333-3333-3333-3333-333333333333']),
  '10000000-0000-0000-0000-000000000002': new Set(['11111111-1111-1111-1111-111111111111'])
};

const statusHistory = [];
const mockNotifications = [];

const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- ENDPOINTS ---

// Root / Health Check endpoint
app.get('/', (req, res) => {
  res.json({
    app: "Bharat Patrol Backend API",
    mode: isConfigured ? "Production (Supabase Connected)" : "Development (Mock Fallback)",
    supabase_configured: isConfigured,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// 1. POST /reports
// Request Body: { user_id, lat, lng, category, photo_url }
app.post('/reports', async (req, res) => {
  const { user_id, lat, lng, category, photo_url } = req.body;
  
  if (!user_id || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Missing required fields: user_id, lat, lng' });
  }

  if (isConfigured && supabase) {
    try {
      // Lookup user's ward
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('ward')
        .eq('id', user_id)
        .maybeSingle();
      
      const ward = userData?.ward || null;

      // Insert new report
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          user_id,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          category,
          photo_url,
          status: 'pending',
          ward
        }])
        .select('id, status')
        .single();

      if (error) throw error;
      return res.status(201).json({ id: data.id, status: data.status });
    } catch (err) {
      console.error('Supabase error in POST /reports:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    const user = users.find(u => u.id === user_id);
    const ward = user ? user.ward : 'Unknown Ward';

    const newReport = {
      id: generateUuid(),
      user_id,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      category,
      description: '',
      photo_url,
      ai_verified: null,
      ai_severity: null,
      ai_issue_type: null,
      status: 'pending',
      priority_score: 0,
      ward,
      resolution_photo_url: null,
      created_at: new Date().toISOString()
    };

    reports.push(newReport);
    reportVotes[newReport.id] = new Set();

    return res.status(201).json({
      id: newReport.id,
      status: newReport.status
    });
  }
});

// 2. POST /reports/:id/verify
// Request Body: { ai_verified, ai_severity, ai_issue_type, description }
app.post('/reports/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { ai_verified, ai_severity, ai_issue_type, description } = req.body;

  if (isConfigured && supabase) {
    try {
      const status = ai_verified ? 'live' : 'rejected';

      // Get old status first for history audit trail
      const { data: currentReport, error: fetchError } = await supabase
        .from('reports')
        .select('status')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !currentReport) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Update report details
      const { data: updatedReport, error: updateError } = await supabase
        .from('reports')
        .update({
          ai_verified: !!ai_verified,
          ai_severity: ai_severity !== undefined ? parseInt(ai_severity) : null,
          ai_issue_type: ai_issue_type || null,
          description: description || null,
          status
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log status history
      await supabase
        .from('status_history')
        .insert([{
          report_id: id,
          old_status: currentReport.status,
          new_status: status,
          changed_by: null // System/AI update
        }]);

      return res.json(updatedReport);
    } catch (err) {
      console.error('Supabase error in POST /reports/:id/verify:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    const reportIndex = reports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[reportIndex];
    report.ai_verified = !!ai_verified;
    report.ai_severity = ai_severity !== undefined ? parseInt(ai_severity) : null;
    report.ai_issue_type = ai_issue_type || null;
    if (description) {
      report.description = description;
    }

    const oldStatus = report.status;
    report.status = ai_verified ? 'live' : 'rejected';

    statusHistory.push({
      id: generateUuid(),
      report_id: report.id,
      old_status: oldStatus,
      new_status: report.status,
      changed_by: '00000000-0000-0000-0000-000000000000',
      changed_at: new Date().toISOString()
    });

    return res.json(report);
  }
});

// 3. GET /reports
// Query params: sort=priority|date, status=live|resolved|in_progress, category=xyz
app.get('/reports', async (req, res) => {
  const { sort, status, category } = req.query;

  if (isConfigured && supabase) {
    try {
      // Build query to select report fields and count related votes
      let query = supabase
        .from('reports')
        .select('*, votes(count)');

      // Apply category filter
      if (category) {
        query = query.eq('category', category);
      }

      // Apply status filter (comma separated values supported)
      if (status) {
        const statuses = status.split(',').map(s => s.trim());
        query = query.in('status', statuses);
      }

      // Apply sorting
      if (sort === 'priority') {
        query = query
          .order('priority_score', { ascending: false })
          .order('created_at', { ascending: false });
      } else {
        // Default: Sort by date
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map Supabase relation format to match requested exact JSON schema
      const mappedReports = data.map(r => {
        const voteCountObj = r.votes && r.votes[0];
        const vote_count = voteCountObj ? voteCountObj.count : 0;
        
        // Exclude the raw votes relation array
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
    let filteredReports = [...reports];

    if (category) {
      filteredReports = filteredReports.filter(r => r.category && r.category.toLowerCase() === category.toLowerCase());
    }

    if (status) {
      const statuses = status.split(',').map(s => s.trim().toLowerCase());
      filteredReports = filteredReports.filter(r => r.status && statuses.includes(r.status.toLowerCase()));
    }

    const mappedReports = filteredReports.map(r => {
      const voteSet = reportVotes[r.id] || new Set();
      return {
        ...r,
        vote_count: voteSet.size
      };
    });

    if (sort === 'priority') {
      mappedReports.sort((a, b) => {
        if (b.priority_score !== a.priority_score) {
          return b.priority_score - a.priority_score;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
    } else {
      mappedReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return res.json(mappedReports);
  }
});

// 4. POST /reports/:id/vote
// Request Body: { user_id }
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
        .select('priority_score')
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

      const escalation_ready = currentScore >= 25;

      // 4. Trigger Automatic WhatsApp Escalation if threshold crossed and not already sent
      if (escalation_ready) {
        try {
          const { data: existingNotification, error: notifError } = await supabase
            .from('notifications')
            .select('id')
            .eq('report_id', id)
            .eq('type', 'whatsapp')
            .maybeSingle();

          if (!existingNotification && !notifError) {
            // Fetch issue details for AI messaging
            const { data: fullReport } = await supabase
              .from('reports')
              .select('ward, category, ai_severity')
              .eq('id', id)
              .maybeSingle();

            if (fullReport) {
              const area = fullReport.ward || 'Unknown Ward';
              const issueType = fullReport.category || 'General Civic Issue';
              const severity = fullReport.ai_severity || 1;

              const messageText = await draftEscalationMessage({
                area,
                issueType,
                severity,
                voteCount: currentScore
              });

              const councillorPhone = process.env.COUNCILLOR_PHONE || '+919999999999';
              await sendWhatsAppAlert(councillorPhone, messageText);

              await supabase
                .from('notifications')
                .insert([{
                  report_id: id,
                  type: 'whatsapp',
                  recipient: councillorPhone
                }]);
            }
          }
        } catch (escalationErr) {
          console.error('Error during WhatsApp escalation process:', escalationErr);
        }
      }

      return res.json({
        priority_score: currentScore,
        escalation_ready
      });
    } catch (err) {
      console.error('Supabase error in POST /reports/:id/vote:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    const reportIndex = reports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[reportIndex];
    if (!reportVotes[id]) {
      reportVotes[id] = new Set();
    }

    const votesSet = reportVotes[id];
    let mockIsNewVote = false;
    if (!votesSet.has(user_id)) {
      votesSet.add(user_id);
      report.priority_score += 1;
      mockIsNewVote = true;
    }

    const escalation_ready = report.priority_score >= 25;

    // Trigger Mock WhatsApp Escalation if threshold crossed and not already sent
    if (escalation_ready && mockIsNewVote) {
      const existingNotification = mockNotifications.find(n => n.report_id === id && n.type === 'whatsapp');
      if (!existingNotification) {
        const area = report.ward || 'Unknown Ward';
        const issueType = report.category || 'General Civic Issue';
        const severity = report.ai_severity || 1;

        draftEscalationMessage({
          area,
          issueType,
          severity,
          voteCount: report.priority_score
        }).then(messageText => {
          const councillorPhone = process.env.COUNCILLOR_PHONE || '+919999999999';
          return sendWhatsAppAlert(councillorPhone, messageText).then(() => {
            mockNotifications.push({
              id: generateUuid(),
              report_id: id,
              type: 'whatsapp',
              recipient: councillorPhone,
              sent_at: new Date().toISOString()
            });
          });
        }).catch(err => {
          console.error('Error during mock WhatsApp escalation:', err);
        });
      }
    }

    return res.json({
      priority_score: report.priority_score,
      escalation_ready
    });
  }
});

// 5. PATCH /reports/:id/status
// Request Body: { new_status, changed_by, resolution_photo_url (optional) }
app.patch('/reports/:id/status', async (req, res) => {
  const { id } = req.params;
  const { new_status, changed_by, resolution_photo_url } = req.body;

  if (!new_status || !changed_by) {
    return res.status(400).json({ error: 'Missing required fields: new_status, changed_by' });
  }

  // Validate status schema values
  const validStatuses = ['pending', 'live', 'in_progress', 'resolved_pending_confirmation', 'resolved', 'reopened', 'rejected'];
  if (!validStatuses.includes(new_status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  // CRITICAL REQUIREMENT validation: resolved_pending_confirmation requires resolution_photo_url
  if (new_status === 'resolved_pending_confirmation' && !resolution_photo_url) {
    return res.status(400).json({
      error: "Status 'resolved_pending_confirmation' requires a resolution_photo_url as evidence of work done."
    });
  }

  if (isConfigured && supabase) {
    try {
      // Get current status for status history
      const { data: currentReport, error: fetchError } = await supabase
        .from('reports')
        .select('status')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !currentReport) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Prepare updates
      const updateFields = { status: new_status };
      if (resolution_photo_url) {
        updateFields.resolution_photo_url = resolution_photo_url;
      }

      // Update status
      const { data: updatedReport, error: updateError } = await supabase
        .from('reports')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log status history audit trail
      await supabase
        .from('status_history')
        .insert([{
          report_id: id,
          old_status: currentReport.status,
          new_status: new_status,
          changed_by: changed_by
        }]);

      return res.json(updatedReport);
    } catch (err) {
      console.error('Supabase error in PATCH /reports/:id/status:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    const reportIndex = reports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[reportIndex];
    const oldStatus = report.status;
    
    report.status = new_status;
    if (resolution_photo_url) {
      report.resolution_photo_url = resolution_photo_url;
    }

    statusHistory.push({
      id: generateUuid(),
      report_id: id,
      old_status: oldStatus,
      new_status: new_status,
      changed_by: changed_by,
      changed_at: new Date().toISOString()
    });

    return res.json(report);
  }
});

// 6. POST /reports/:id/confirm-resolution
// Request Body: { user_id, confirmed: true/false }
app.post('/reports/:id/confirm-resolution', async (req, res) => {
  const { id } = req.params;
  const { user_id, confirmed } = req.body;

  if (!user_id || confirmed === undefined) {
    return res.status(400).json({ error: 'Missing required fields: user_id, confirmed' });
  }

  if (isConfigured && supabase) {
    try {
      // Fetch report to verify user permission (must match original reporter)
      const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // CRITICAL SECURITY constraint check: original reporter validation
      if (report.user_id !== user_id) {
        return res.status(403).json({
          error: 'Access denied. Only the original reporter can confirm or reject the resolution of this report.'
        });
      }

      const oldStatus = report.status;
      const newStatus = confirmed ? 'resolved' : 'reopened';

      // Update status
      const { data: updatedReport, error: updateError } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log status history
      await supabase
        .from('status_history')
        .insert([{
          report_id: id,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: user_id
        }]);

      return res.json(updatedReport);
    } catch (err) {
      console.error('Supabase error in POST /reports/:id/confirm-resolution:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    // Fallback Mock Logic
    const reportIndex = reports.findIndex(r => r.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reports[reportIndex];

    if (report.user_id !== user_id) {
      return res.status(403).json({
        error: 'Access denied. Only the original reporter can confirm or reject the resolution of this report.'
      });
    }

    const oldStatus = report.status;
    report.status = confirmed ? 'resolved' : 'reopened';

    statusHistory.push({
      id: generateUuid(),
      report_id: id,
      old_status: oldStatus,
      new_status: report.status,
      changed_by: user_id,
      changed_at: new Date().toISOString()
    });

    return res.json(report);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Bharat Patrol backend server listening on port ${PORT}`);
});
