// Mineradio after-pack hook — runs after electron-builder packages the app
// Injects additional resources or performs post-processing on the packaged app

exports.default = async function (context) {
  const { appOutDir, packager } = context;

  // Ensure cookie files are not included in the packaged app
  // The actual injection of resources happens here if needed

  return [];
};
