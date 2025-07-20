// Character Counter - A simple tool to count characters copied to the clipboard.
// Copyright (C) 2025 molyashi
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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