# Vercel Deployment Guide

This guide outlines the steps to deploy the `radcalcpro2` PWA to Vercel.

## Prerequisites

1.  A GitHub account with the repository pushed.
2.  A Vercel account.

## Deployment Steps

1.  **Push to GitHub:** Ensure your latest code, including the updated `vercel.json`, `package.json`, and `tsconfig.json`, is pushed to your GitHub repository.
2.  **Import Project in Vercel:** Log in to your Vercel dashboard and click "Add New..." -> "Project". Select your GitHub repository.
3.  **Configure Project:**
    *   **Framework Preset:** Vercel should auto-detect **Vite**.
    *   **Build Command:** Ensure it is set to `npm run build` (or leave it as default if it auto-detects `vite build`).
    *   **Output Directory:** Ensure it is set to `dist`.
4.  **Environment Variables:**
    *   Add the `VITE_GEMINI_API_KEY` environment variable in the Vercel project settings.
5.  **Deploy:** Click the "Deploy" button.

The deployment should succeed on the first attempt, as the TypeScript configuration has been strictly audited and fixed, and the Vercel configuration (`vercel.json`) is properly set up to handle the Vite build and SPA routing.
