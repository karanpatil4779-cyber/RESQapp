# ResQLink Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Twilio Account**: Get Account SID, Auth Token, and Phone Number from [twilio.com](https://twilio.com)

## Deployment Steps

### 1. Create Railway Project

1. Log in to Railway and create a new project
2. Add a **PostgreSQL** database to the project
3. Note the `DATABASE_URL` from the database variables

### 2. Deploy Backend

1. Connect your GitHub repository to Railway
2. Set the following environment variables in Railway:
   - `DATABASE_URL`: PostgreSQL connection string (from step 1)
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
   - `TWILIO_PHONE_NUMBER`: Your Twilio phone number (e.g., +1234567890)
   - `ADMIN_PHONE`: Your phone number for SMS alerts (+919999999999)
   - `ADMIN_WHATSAPP`: Your WhatsApp number (whatsapp:+919999999999)
   - `PORT`: 3001

3. Set the root directory to `server` in Railway settings
4. Deploy the backend

### 3. Deploy Frontend

1. In Railway, add a new service and connect to your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your backend URL (e.g., https://your-backend.railway.app/api)

### 4. Verify

- Check Railway logs for successful deployment
- Test the API endpoints
- Submit a test incident and verify SMS/WhatsApp notifications

## Database Schema

The backend automatically creates these tables:
- `users` - User registration
- `incidents` - Emergency reports
- `resources` - Available resources
- `volunteers` - Volunteer tracking
- `notifications` - SMS/WhatsApp notification logs

## Testing Locally

1. Start PostgreSQL locally or use Docker:
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=resqlink postgres
   ```

2. Create server/.env file:
   ```
   DATABASE_URL=postgres://postgres:password@localhost:5432/resqlink
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ADMIN_PHONE=+919999999999
   ```

3. Run server: `cd server && npm start`
4. Run frontend: `npm run dev`