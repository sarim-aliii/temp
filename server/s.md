# Render Deployment Guide (FREE TIER)

## Why Render?
- ✅ **100% Free tier** for web services
- ✅ No credit card required
- ✅ Automatic deployments from GitHub
- ✅ Free SSL certificates
- ✅ Perfect for Node.js backends with Socket.IO

## Quick Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 2. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (free)
3. No credit card required!

### 3. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select `blurchat-backend` repository
4. Render will auto-detect Node.js

### 4. Configure Build Settings
- **Name:** `blurchat-backend` (or any name)
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:prod`
- **Plan:** **Free** (select this!)

### 5. Set Environment Variables
Click **"Environment"** tab and add:

**Required:**
```
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-very-secure-random-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail
EMAIL_FROM=your-email@gmail.com
GEMINI_API_KEY=your-gemini-api-key
```

**Optional (for payments):**
```
EASEBUZZ_KEY=your-easebuzz-key
EASEBUZZ_SALT=your-easebuzz-salt
EASEBUZZ_ENV=test
APP_BASE_URL=https://your-app.onrender.com
```

**Important:**
- ✅ Render automatically sets `PORT` - don't set it manually
- ✅ Update `FRONTEND_URL` to your production frontend URL
- ✅ Update Google OAuth callback URL

### 6. Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth 2.0 Client
3. Add authorized redirect URI:
   ```
   https://your-app-name.onrender.com/api/auth/google/callback
   ```
4. Replace `your-app-name` with your actual Render service name

### 7. Deploy!
1. Click **"Create Web Service"**
2. Render will build and deploy automatically
3. Your backend will be at: `https://your-app-name.onrender.com`

## Render Free Tier Details

### What You Get:
- ✅ **750 hours/month** free (enough for 24/7 if it's your only service)
- ✅ **Free SSL** certificates
- ✅ **Auto-deployments** from GitHub
- ✅ **Unlimited bandwidth**
- ✅ **No credit card required**

### Limitations:
- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ **Takes ~30 seconds to wake up** when someone visits
- ⚠️ **512MB RAM** limit
- ⚠️ **0.1 CPU** (shared)

### For Production:
If you need always-on (no spin-down), upgrade to **Starter Plan ($7/month)**:
- Always on
- 512MB RAM
- 0.5 CPU
- Better for Socket.IO connections

## Troubleshooting

### Build Fails
- Check logs in Render dashboard
- Ensure `package.json` has correct scripts
- Verify TypeScript compiles locally: `npm run build`

### Server Won't Start
- Check environment variables are all set
- Verify `MONGO_URI` is correct and accessible
- Check logs for specific error messages

### Database Connection Issues
- Ensure MongoDB allows connections from Render's IPs (0.0.0.0/0)
- Verify connection string format
- Check MongoDB Atlas network access settings

### CORS Issues
- Update `FRONTEND_URL` to match your actual frontend domain
- Ensure no trailing slashes in the URL

### Google OAuth Not Working
- Verify callback URL matches exactly in Google Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure redirect URI uses HTTPS

### Socket.IO Connection Issues
- Free tier spin-down can disconnect Socket.IO connections
- Consider upgrading to Starter plan for always-on
- Client should handle reconnection automatically

## Useful Render Features

### Custom Domain
1. Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

### Environment Variables
- Use Render's variable management (recommended)
- Variables are encrypted and secure

### Monitoring
- Check **Logs** tab for real-time logs
- Check **Metrics** tab for CPU, Memory usage
- Set up alerts for errors

### Automatic Deployments
- Auto-deploys on every push to main branch
- Or set up branch-based deployments in settings
- Manual deploy option available

## Cost Optimization

- Free tier is perfect for development/testing
- Upgrade to Starter ($7/month) for production with always-on
- Monitor usage in the Metrics tab

