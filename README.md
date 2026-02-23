<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1CIPSaHZRSxwFmD5vzgkMQIsp1cygxWQ3

## Run Locally

**Prerequisites:** Node.js (v18+)

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure Environment:**
   Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key (see `.env.example` for reference).
3. **Run the app:**
   ```bash
   npm run dev
   ```

## Deployment Info

### Deploying to Vercel

1. **Upload to GitHub:**
   - Create a new repository on GitHub.
   - Run the following commands in your terminal:
     ```bash
     git init
     git add .
     git commit -m "initial commit"
     git branch -M main
     git remote add origin YOUR_REPOSITORY_URL
     git push -u origin main
     ```
2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in.
   - Click **Add New** > **Project**.
   - Import your GitHub repository.
3. **Add Environment Variables:**
   - During the import, go to the **Environment Variables** section.
   - Add `GEMINI_API_KEY` with your actual key.
4. **Deploy:**
   - Click **Deploy**. Vercel will automatically build and host your app.
