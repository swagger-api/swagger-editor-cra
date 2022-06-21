'use strict';

const { gitDescribeSync } = require('git-describe');
const paths = require('../../paths');

module.exports = () => {
  try {
    return gitDescribeSync(paths.appPath);
  } catch (e) {
    console.error('getDescribeSync error:', e);
    return {
      hash: 'noGit',
      dirty: false,
    };
  }
};
