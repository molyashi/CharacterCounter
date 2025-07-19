const fs = require('fs');
const path = require('path');

function getElectronPath() {
  let electronPath = path.join(__dirname, '..', 'node_modules', 'electron');
  try {
    const electronPackage = require(path.join(electronPath, 'package.json'));
    return path.dirname(require.resolve('electron'));
  } catch (e) {
    throw new Error('Could not find electron package');
  }
}

const electronPath = getElectronPath();
const platform = process.platform;
let snapshotPath;

if (platform === 'darwin') {
  snapshotPath = path.join(
    electronPath,
    'dist',
    'Electron.app',
    'Contents',
    'Frameworks',
    'Electron Framework.framework',
    'Versions',
    'A',
    'Resources'
  );
} else {
  snapshotPath = path.join(electronPath, 'dist');
}

const snapshotBlobPath = path.join(__dirname, '..', 'v8_context_snapshot.bin');
const destPath = path.join(snapshotPath, 'v8_context_snapshot.bin');

if (fs.existsSync(snapshotBlobPath)) {
  console.log(`Copying snapshot blob to ${destPath}`);
  fs.copyFileSync(snapshotBlobPath, destPath);
  console.log('Snapshot copied successfully.');
} else {
  console.error(`Snapshot file not found at ${snapshotBlobPath}`);
  process.exit(1);
}