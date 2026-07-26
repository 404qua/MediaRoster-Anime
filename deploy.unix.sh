#!/bin/bash
set -e  # exit on first error

# 1. Build the project
echo "Building project..."
python hash.py

# 2. Make a temporary commit with the build folder
echo "Creating temporary commit..."
git add -f build
git commit -m "temp build commit"

# 3. Push the build to gh-pages (force overwrite)
echo "Pushing to gh-pages..."
BUILD_COMMIT=$(git subtree split --prefix build HEAD)
git push origin $BUILD_COMMIT:gh-pages --force

# 4. Remove the temporary commit
echo "Cleaning up temporary commit..."
git reset --hard HEAD~

# 5. Remove untracked files just in case
git clean -fd

# 6. Remove local build folder
rm -rf build

echo "Deployment complete!"