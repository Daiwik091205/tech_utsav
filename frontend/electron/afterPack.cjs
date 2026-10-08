const { execSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  console.log(`[afterPack] Applying clean ad-hoc code signature to: ${appPath}`);
  try {
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
    console.log(`[afterPack] Successfully applied ad-hoc code signature.`);
  } catch (err) {
    console.error(`[afterPack] Error signing app bundle:`, err);
  }
};
