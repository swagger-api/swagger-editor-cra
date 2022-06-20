const os = require('os');
const pkg = require('../../../package.json');

// git-describe
const getGitDescription = require('./getGitDescription');

module.exports = () => {
  const gitInfo = getGitDescription();
  const buildInfo = {
    PACKAGE_VERSION: pkg.version,
    GIT_COMMIT: gitInfo.hash,
    GIT_DIRTY: gitInfo.dirty,
    HOSTNAME: os.hostname(),
    BUILD_TIME: new Date().toUTCString()
  };
  return JSON.stringify(buildInfo);
};
