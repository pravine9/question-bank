#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful! The project is ready for GitHub Pages deployment."
    echo ""
    echo "To deploy to GitHub Pages:"
    echo "1. Push your changes to the main branch"
    echo "2. Go to your repository settings on GitHub"
    echo "3. Navigate to 'Pages' in the left sidebar"
    echo "4. Set source to 'Deploy from a branch'"
    echo "5. Select 'main' branch and '/docs' folder (or '/dist' if you prefer)"
    echo "6. Click 'Save'"
    echo ""
    echo "Your site will be available at: https://[username].github.io/question-bank/"
    echo ""
    echo "Note: If you want to use the /dist folder instead of /docs, you can:"
    echo "- Copy the contents of dist/ to docs/ folder"
    echo "- Or configure GitHub Pages to use the /dist folder"
else
    echo "Build failed! Please fix the errors before deploying."
    exit 1
fi
