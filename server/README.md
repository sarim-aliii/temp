# BlurChat Backend

Backend server for BlurChat built with Express, TypeScript, Socket.IO, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=8080
FRONTEND_URL=http://localhost:3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
EMAIL_SERVICE=gmail
EMAIL_FROM=your_email
GEMINI_API_KEY=your_gemini_api_key
```

3. Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:8080`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run build` - Build TypeScript to JavaScript
- `npm run start:prod` - Start production server from built files

## Environment Variables

- `PORT` - Server port (default: 8080) - Render automatically sets this
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `EMAIL_USER` - Email address for sending emails
- `EMAIL_PASS` - Email password or app password
- `EMAIL_SERVICE` - Email service provider (default: gmail)
- `EMAIL_FROM` - Email sender address (defaults to EMAIL_USER)
- `GEMINI_API_KEY` - Google Gemini API key for video generation
- `EASEBUZZ_KEY` - Easebuzz payment gateway key (optional)
- `EASEBUZZ_SALT` - Easebuzz payment gateway salt (optional)
- `EASEBUZZ_ENV` - Easebuzz environment (test/production) (optional)
- `APP_BASE_URL` - Base URL for payment callbacks (optional)

## Render Deployment

### Quick Start

1. **Create Render Account:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (free, no credit card required)

2. **Create New Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select `blurchat-backend` repository

3. **Configure Settings:**
   - **Name:** `blurchat-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** **Free** (select this!)

4. **Set Environment Variables:**
   In the **Environment** tab, add:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_SERVICE=gmail
   EMAIL_FROM=your_email@gmail.com
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. **Update Google OAuth:**
   Add callback URL: `https://your-app-name.onrender.com/api/auth/google/callback`

6. **Deploy:**
   - Click **"Create Web Service"**
   - Render will automatically build and deploy

Your app will be available at: `https://your-app-name.onrender.com`

### Render Free Tier
- ✅ 750 hours/month free (enough for 24/7)
- ✅ Free SSL certificates
- ✅ Auto-deployments from GitHub
- ⚠️ Spins down after 15 min inactivity (~30s wake-up time)
- ⚠️ 512MB RAM, 0.1 CPU

**Note:** For production with always-on (no spin-down), upgrade to Starter Plan ($7/month).

For detailed deployment instructions, see [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)

