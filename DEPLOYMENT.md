# Deployment Guide

This guide explains how to deploy the GPhC Question Bank to GitHub Pages.

## Prerequisites

- Node.js 20.19+ installed
- Git repository set up with GitHub
- GitHub Pages enabled in repository settings

## Automatic Deployment (Recommended)

The project is configured with GitHub Actions for automatic deployment:

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"

2. **Push to Deploy**:
   - Every push to `main` or `master` branch triggers deployment
   - Pull requests create preview deployments
   - Manual deployment available via Actions tab

3. **Access Your Site**:
   - Site will be available at: `https://pravine9.github.io/question-bank`
   - Deployment status shown in Actions tab

## Manual Deployment

If you need to deploy manually:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# The dist/ folder contains the built files
# Upload these files to your web server
```

## Build Configuration

- **Base Path**: `/question-bank/` (configured in `vite.config.ts`)
- **Output Directory**: `dist/`
- **Build Command**: `npm run build`
- **Node Version**: 20.19+

## Troubleshooting

### Common Issues

1. **404 Errors**: Ensure the base path in `vite.config.ts` matches your repository name
2. **Build Failures**: Check Node.js version (requires 20.19+)
3. **Missing Assets**: Verify all question bank files are in `public/question_banks/`

### GitHub Actions Issues

- Check the Actions tab for detailed error logs
- Ensure repository has proper permissions for Pages deployment
- Verify the workflow file is in `.github/workflows/deploy.yml`

## Local Testing

Test the production build locally:

```bash
npm run build
npm run preview
```

This will serve the built files at `http://localhost:4173` for testing.
