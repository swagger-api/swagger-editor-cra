'use strict';

const paths = require('./paths');
const configFactory = require('./webpack.config');
const nodeExternals = require('webpack-node-externals');

module.exports = function (webpackEnv) {
  const config = configFactory(webpackEnv)
  const shouldProduceCompactBundle = process.env.REACT_APP_COMPACT_BUNDLE !== 'false';

  config.output.path = paths.appDist;
  config.output.filename = 'swagger-ide.mjs';
  config.output.module = true;
  config.output.libraryTarget = 'module';
  config.output.library = {
    type: 'module',
  };
  config.experiments = {
    outputModule: true,
    asyncWebAssembly: true,
    syncWebAssembly: true,
  };
  config.output.environment = {
    module: true,
  };
  config.externalsType = 'module';
  config.externals = [
    config.externals,
    nodeExternals({
      importType: 'module',
      allowlist: [
        'swagger-ui-react/swagger-ui.css',
        '@asyncapi/react-component/styles/default.min.css'
      ]
    })
  ];
  delete config.output.chunkFilename;
  delete config.output.assetModuleFilename;
  delete config.output.publicPath;

  config.optimization.splitChunks = {
    cacheGroups: {
      default: false
    },
  };
  config.optimization.runtimeChunk = false;

  if (shouldProduceCompactBundle) {
    /**
     * Bundle WASM file directly into JavaScript bundle as data URLs.
     * This configuration reduces the complexity of WASM file loading
     * but increases the overal bundle size.
     */
    config.module.rules[1].oneOf.unshift({
      test: /\.wasm$/,
      type: 'asset/inline',
    });
  } else {
    /**
     * The default way in which webpack loads wasm files won’t work in a worker,
     * so we will have to disable webpack’s default handling of wasm files and
     * then fetch the wasm file by using the file path that we get using file-loader.
     *
     * Resource: https://pspdfkit.com/blog/2020/webassembly-in-a-web-worker/
     */
    config.module.rules[1].oneOf.unshift({
      test: /\.wasm$/,
      loader: 'file-loader',
      type: 'javascript/auto', // this disables webpacks default handling of wasm
    });
  }

  /**
   * Native handling of web workers doesn't support inlining.
   * Unless we use publicPath the worker-loader works well with webpack@5.
   *
   * Resource: https://mmazzarolo.com/blog/2021-09-03-loading-web-workers-using-webpack-5/
   */
  const workerRule = config.module.rules[1].oneOf.find((rule) => String(rule.test) === '/\\.worker\\.(c|m)?js$/i')
  workerRule.use[0].options.inline = 'no-fallback';
  delete workerRule.use[0].options.filename;
  delete workerRule.use[0].options.chunkFilename;

  const svgRule = config.module.rules[1].oneOf.find((rule) => String(rule.test) === '/\\.svg$/');
  if (shouldProduceCompactBundle) {
    /**
     * We want all SVG files become part of the bundle.
     */
    svgRule.type = 'asset/inline';
    svgRule.use.pop();
  } else {
    svgRule.use[1].options.name = '[name].[hash].[ext]'
  }

  if (shouldProduceCompactBundle) {
    /**
     * We want TTF font from Monaco editor become part of the bundle.
     */
    config.module.rules[1].oneOf.unshift({
      test: /\.ttf$/,
      type: 'asset/inline',
    });
  }

  /**
   * We want to have deterministic name for our CSS bundle.
   */
  const miniCssExtractPlugin = config.plugins.find((plugin) => plugin.constructor.name === 'MiniCssExtractPlugin');
  miniCssExtractPlugin.options.filename = 'swagger-ide.css';

  config.plugins = config.plugins.filter((plugin) => ![
    'HtmlWebpackPlugin',
    'InlineChunkHtmlPlugin',
    'InterpolateHtmlPlugin',
    'ReactRefreshWebpackPlugin',
    'WebpackManifestPlugin',
    'WorkboxWebpackPlugin'
  ].includes(plugin.constructor.name));

  return config;
};
