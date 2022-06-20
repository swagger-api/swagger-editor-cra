const { gitDescribeSync } = require('git-describe');

module.exports = () => {
  try {
    return gitDescribeSync(__dirname);
  } catch (e) {
    console.error('getDescribeSync error:', e);
    return {
      hash: 'noGit',
      dirty: false,
    };
  }
};
