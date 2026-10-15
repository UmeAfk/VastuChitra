'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const images = [
  '0033 - Uptown Avenue - 01 - 230926.tif',
  '0033 - Uptown Avenue - 05 - 230926.tif',
  '2309 - Persistent Option 02 (13).jpg',
  '2309 - Persistent Option 01 (4).jpg',
  '2613 - Kohinoor Central Park - Hires _09.tif',
  '2644 - Kohinoor Mhalunge Exterior Renders - 190724 - 05.tif',
  '0252 - Royal Realty - Rahatani - Hires 3d Renders 02.tif',
  '0033 - Uptown Avenue - 02 - 230926.tif',
  '0033 - Uptown Avenue - 03 - 230926.tif',
  '2467 - Boat Club Road - 03.jpg',
  '1625 - Seed Tree Ananta One (1).jpg',
  'Kids Play copy.tif',
  '2761 - Cotton Market - 15.jpg',
  '0110 - Kohinoor-Archana - 03.tif',
  '1525 - Kwality World Developers Hires 3d - 01.tif',
  'Senior Ci copy.tif',
  '2761 - Cotton Market - 02.jpg',
  'Library copy.tif'
];
(async () => {
  let config = { rootPath: 'assets' };
  try { config = JSON.parse(fs.readFileSync(path.join(root, 'media-config.json'), 'utf8')); } catch {}
  const mediaRoot = path.resolve(root, config.rootPath || 'assets');
  const output = path.join(root, 'public', 'demo');
  fs.mkdirSync(output, { recursive: true });
  // Process large source renders sequentially to keep peak memory predictable.
  for (const [index, filename] of images.entries()) {
    const destination = path.join(output, `project-${index + 1}.webp`);
    const source = path.join(mediaRoot, filename);
    // The compressed demo collection is tracked; other machines need no originals.
    if (fs.existsSync(destination) && (!fs.existsSync(source) || fs.statSync(destination).mtimeMs >= fs.statSync(source).mtimeMs)) continue;
    await sharp(source, { limitInputPixels: false, unlimited: true, sequentialRead: true })
      .rotate().resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 83 }).toFile(destination);
  }
  const dist = path.join(root, 'meeting-dist');
  fs.mkdirSync(dist, { recursive: true });
  for (const folder of ['css', 'js']) fs.mkdirSync(path.join(dist, folder), { recursive: true });
  fs.copyFileSync(path.join(root, 'css', 'styles.css'), path.join(dist, 'css', 'styles.css'));
  fs.copyFileSync(path.join(root, 'css', 'admin.css'), path.join(dist, 'css', 'admin.css'));
  fs.copyFileSync(path.join(root, 'admin.html'), path.join(dist, 'admin.html'));
  for (const name of ['script.js', 'meeting.js', 'admin.js']) fs.copyFileSync(path.join(root, 'js', name), path.join(dist, 'js', name));
  fs.mkdirSync(path.join(dist, 'public'), { recursive: true });
  fs.copyFileSync(path.join(root, 'public', 'logo-ui.png'), path.join(dist, 'public', 'logo-ui.png'));
  fs.cpSync(output, path.join(dist, 'public', 'demo'), { recursive: true });
  // Ship only the meeting catalogue, without machine paths or the saved project catalogue.
  fs.writeFileSync(path.join(dist, 'js', 'projects.js'), 'window.VASTUCHITRA = { settings: {}, projects: [] };\n');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace('<html lang="en">', '<html lang="en" data-meeting="true">')
    .replace('<script src="js/projects.js"></script>', '<script>window.VASTUCHITRA = { settings: {}, projects: [] };</script>');
  fs.writeFileSync(path.join(root, 'meeting.html'), html);
  fs.writeFileSync(path.join(dist, 'index.html'), html);
  fs.writeFileSync(path.join(dist, 'vercel.json'), JSON.stringify({ cleanUrls: true, outputDirectory: '.' }, null, 2));
  console.log(`Meeting preview ready: ${images.length} optimized images in meeting-dist.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
