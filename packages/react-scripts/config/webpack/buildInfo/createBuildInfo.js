'use strict';

const paths = require('../../paths');
const pkg = require(paths.appPackageJson);
const getGitDescription = require('./getGitDescription');

module.exports = () => {
  const gitInfo = getGitDescription();
  const raw = {
    PACKAGE_VERSION: pkg.version,
    GIT_COMMIT: gitInfo.hash,
    GIT_DIRTY: gitInfo.dirty,
    BUILD_TIME: new Date().toUTCString()
  };
  // Stringify all values so we can feed into webpack DefinePlugin
  const stringified = {
    'buildInfo': Object.keys(raw).reduce((buildInfo, key) => {
      buildInfo[key] = JSON.stringify(raw[key]);
      return buildInfo;
    }, {}),
  };

  return { raw, stringified };
};
