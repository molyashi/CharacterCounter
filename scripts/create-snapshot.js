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

const childProcess = require('child_process');
const vm = require('vm');
const path = require('path');
const fs = require('fs');
const electronLink = require('electron-link');

const excludedModules = {};
const baseDirPath = path.resolve(__dirname, '..');
const cachePath = path.resolve(baseDirPath, 'cache');

async function main() {
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath);
  }

  console.log('Creating a linked script..');
  const result = await electronLink({
    baseDirPath: baseDirPath,
    mainPath: path.resolve(__dirname, 'snapshot.js'),
    cachePath: cachePath,
    shouldExcludeModule: (modulePath) => excludedModules.hasOwnProperty(modulePath),
  });

  const snapshotScriptPath = path.join(cachePath, 'snapshot.js');
  fs.writeFileSync(snapshotScriptPath, result.snapshotScript);

  console.log('Verifying snapshot script...');
  vm.runInNewContext(result.snapshotScript, undefined, {
    filename: snapshotScriptPath,
    displayErrors: true,
  });

  const outputBlobPath = baseDirPath;
  console.log(`Generating startup blob in "${outputBlobPath}"`);

  const mksnapshotBin = path.resolve(
    baseDirPath,
    'node_modules',
    '.bin',
    'mksnapshot' + (process.platform === 'win32' ? '.cmd' : '')
  );

  childProcess.execFileSync(
    mksnapshotBin,
    [snapshotScriptPath, '--output_dir', outputBlobPath]
  );

  console.log('Snapshot blob created at v8_context_snapshot.bin');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});