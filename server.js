import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Use 'build' directory if it exists and has content, otherwise use workspace root
const buildPath = path.join(__dirname, 'build');
const staticDir = fs.existsSync(buildPath) && fs.readdirSync(buildPath).length > 0
  ? buildPath
  : __dirname;

console.log(`Serving static files from: ${staticDir}`);
app.use(express.static(staticDir));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 MediaRoster Server is running at http://localhost:${PORT}`);
});
