const { notarize } = require('@electron/notarize');

module.exports = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  // We require explicit credentials; never guess or auto-discover.
  // Preferred: App Store Connect API key.
  const apiKey = process.env.APPLE_API_KEY;
  const apiKeyId = process.env.APPLE_API_KEY_ID;
  const apiIssuer = process.env.APPLE_API_ISSUER;
  // Fallback: Apple ID + app-specific password + team ID.
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  const hasApiKey = Boolean(apiKey && apiKeyId && apiIssuer);
  const hasAppleId = Boolean(appleId && appleIdPassword && teamId);

  if (!hasApiKey && !hasAppleId) {
    // No credentials => skip notarization. This keeps the existing unsigned
    // local build path working while the repo is private and credentials are
    // not yet provisioned.
    console.warn('[notarize] Skipping: no Apple notarization credentials in environment.');
    return;
  }

  const options = {
    appPath: `${appOutDir}/${appName}.app`,
    teamId,
  };

  if (hasApiKey) {
    options.key = apiKey;
    options.keyId = apiKeyId;
    options.issuer = apiIssuer;
  } else {
    options.appleId = appleId;
    options.appleIdPassword = appleIdPassword;
  }

  console.log(`[notarize] Submitting ${options.appPath} for notarization...`);
  await notarize(options);
  console.log('[notarize] Notarization completed.');
};
