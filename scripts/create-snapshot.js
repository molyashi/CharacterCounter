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