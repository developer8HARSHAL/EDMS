#!/bin/bash
# Final cleanup script - removes unnecessary files from repository

echo "🧹 Final cleanup for production..."

# Remove development documentation
rm -rf .codeviz/
rm -f features.txt flow.txt flow_done.txt workspace_feature.txt
rm -rf deployment_guide/

# Clean test files
rm -f backend/test/*.test.js
rm -f backend/test/setup.js

# Clean uploaded test files (keep .gitkeep)
find backend/uploads -type f ! -name '.gitkeep' -delete

# Clean frontend test files (optional - keep if you want tests)
# rm -f frontend/src/*.test.js
# rm -f frontend/src/setupTests.js

# Update .gitignore to ensure these don't come back
cat >> .gitignore << 'EOF'

# Deployment artifacts
.codeviz/
features.txt
flow.txt
flow_done.txt
workspace_feature.txt
deployment_guide/

# Test files
backend/test/*.test.js
backend/test/setup.js

# Uploaded files
backend/uploads/*
!backend/uploads/.gitkeep
EOF

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Files removed:"
echo "  - Development documentation"
echo "  - Test files"
echo "  - Uploaded test documents"
echo ""
echo "Next: git add . && git commit -m 'chore: cleanup dev files' && git push"