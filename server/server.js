import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const ADMIN_PHONE = process.env.ADMIN_PHONE || '+919999999999';
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || 'whatsapp:+919999999999';

const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function initDatabase() {
  if (!pool) {
    console.log('No database configured, skipping DB initialization');
    return;
  }
  
  const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100),
      role VARCHAR(20) DEFAULT 'CIVILIAN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id SERIAL PRIMARY KEY,
      external_id VARCHAR(50) UNIQUE,
      type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      status VARCHAR(20) DEFAULT 'REPORTED',
      description TEXT,
      lat FLOAT,
      lng FLOAT,
      location_name VARCHAR(255),
      reporter_phone VARCHAR(20),
      reporter_id VARCHAR(50),
      verified BOOLEAN DEFAULT FALSE,
      votes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      type VARCHAR(100) NOT NULL,
      quantity INTEGER,
      unit VARCHAR(20),
      lat FLOAT,
      lng FLOAT,
      status VARCHAR(20) DEFAULT 'AVAILABLE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      status VARCHAR(20) DEFAULT 'AVAILABLE',
      lat FLOAT,
      lng FLOAT,
      current_task_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      incident_id INTEGER,
      phone VARCHAR(20),
      channel VARCHAR(20),
      status VARCHAR(20) DEFAULT 'SENT',
      twilio_sid VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await pool.query(createTables);
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err.message);
  }
}

async function sendSMS(message, toPhone) {
  if (!client) {
    console.log('Twilio not configured, skipping SMS. Message:', message);
    return null;
  }
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone
    });
    console.log('SMS sent:', result.sid);
    return result.sid;
  } catch (err) {
    console.error('SMS error:', err.message);
    return null;
  }
}

async function sendWhatsApp(message, toPhone) {
  try {
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${toPhone}`
    });
    console.log('WhatsApp sent:', result.sid);
    return result.sid;
  } catch (err) {
    console.error('WhatsApp error:', err.message);
    return null;
  }
}

async function notifyAdmins(incident) {
  const message = `🚨 NEW EMERGENCY REPORT\n\nType: ${incident.type}\nSeverity: ${incident.severity}\nLocation: ${incident.location_name}\nDescription: ${incident.description}\nTime: ${new Date().toLocaleString()}`;
  
  await sendSMS(message, ADMIN_PHONE);
  await sendWhatsApp(message, ADMIN_PHONE);
  
  await pool.query(
    `INSERT INTO notifications (incident_id, phone, channel, status) VALUES ($1, $2, $3, $4)`,
    [incident.id, ADMIN_PHONE, 'SMS', 'SENT']
  );
  await pool.query(
    `INSERT INTO notifications (incident_id, phone, channel, status) VALUES ($1, $2, $3, $4)`,
    [incident.id, ADMIN_PHONE, 'WhatsApp', 'SENT']
  );
}

async function notifyReporter(incident) {
  if (!incident.reporter_phone) return;
  
  const message = `✅ RESQLINK: Your report #${incident.external_id} has been submitted successfully.\n\nType: ${incident.type}\nSeverity: ${incident.severity}\nLocation: ${incident.location_name}\n\nStay safe. Help is on the way.`;
  
  await sendSMS(message, incident.reporter_phone);
  
  await pool.query(
    `INSERT INTO notifications (incident_id, phone, channel, status) VALUES ($1, $2, $3, $4)`,
    [incident.id, incident.reporter_phone, 'SMS', 'SENT']
  );
}

app.post('/api/incidents', async (req, res) => {
  if (!pool) {
    console.log('No database configured, returning mock incident');
    const mockIncident = {
      id: Date.now(),
      type: req.body.type,
      severity: req.body.severity,
      description: req.body.description,
      external_id: `inc-${Date.now()}`
    };
    return res.status(201).json(mockIncident);
  }
  
  try {
    const { type, severity, description, lat, lng, locationName, reporterId, reporterPhone } = req.body;
    
    const result = await pool.query(
      `INSERT INTO incidents (type, severity, description, lat, lng, location_name, reporter_id, reporter_phone, external_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [type, severity, description, lat, lng, locationName, reporterId, reporterPhone, `inc-${Date.now()}`]
    );
    
    const incident = result.rows[0];
    
    await notifyAdmins(incident);
    await notifyReporter(incident);
    
    res.status(201).json(incident);
  } catch (err) {
    console.error('Error creating incident:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/incidents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching incidents:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/incidents/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching incident:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/incidents/:id', async (req, res) => {
  try {
    const { status, verified } = req.body;
    const result = await pool.query(
      `UPDATE incidents SET status = $1, verified = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [status, verified, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating incident:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const active = await pool.query("SELECT COUNT(*) FROM incidents WHERE status != 'RESOLVED'");
    const critical = await pool.query("SELECT COUNT(*) FROM incidents WHERE severity = 'CRITICAL' AND status != 'RESOLVED'");
    const resolved = await pool.query("SELECT COUNT(*) FROM incidents WHERE status = 'RESOLVED'");
    const resources = await pool.query("SELECT COUNT(*) FROM resources WHERE status = 'AVAILABLE'");
    
    res.json({
      active: parseInt(active.rows[0].count),
      critical: parseInt(critical.rows[0].count),
      resolved: parseInt(resolved.rows[0].count),
      resourcesAvailable: parseInt(resources.rows[0].count)
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/volunteers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM volunteers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching volunteers:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { phone, name, role } = req.body;
    const result = await pool.query(
      `INSERT INTO users (phone, name, role) VALUES ($1, $2, $3) ON CONFLICT (phone) DO UPDATE SET name = $2, role = $3 RETURNING *`,
      [phone, name, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    const otp = generateOTP();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
    
    const message = `Your ResQLink verification code is: ${otp}. Valid for 5 minutes.`;
    await sendSMS(message, phone);
    
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }
    
    const stored = otpStore.get(phone);
    
    if (!stored) {
      return res.status(400).json({ error: 'No OTP sent to this number' });
    }
    
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP expired' });
    }
    
    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    otpStore.delete(phone);
    
    const userResult = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user;
    
    if (userResult.rows.length === 0) {
      user = await pool.query(
        `INSERT INTO users (phone, name, role) VALUES ($1, $2, $3) RETURNING *`,
        [phone, `User-${phone.slice(-4)}`, 'CIVILIAN']
      );
      user = user.rows[0];
    } else {
      user = userResult.rows[0];
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});