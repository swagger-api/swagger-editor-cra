/**
 * Copy obtained from: https://github.com/sibiraj-s/replace-asset-name-webpack-plugin
 *
 * MIT License
 *
 * Copyright (c) 2021-present Sibiraj
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const PLUGIN_NAME = 'ReplaceAssetNamePlugin';

class ReplaceAssetNameWebpackPlugin {
  constructor(options) {
    this.options = options;
  }

  replace(compiler, compilation, assets) {
    const {
      ModuleFilenameHelpers,
      sources: { RawSource },
    } = compiler.webpack;

    const logger = compilation.getLogger(PLUGIN_NAME);
    const allAssets = Object.keys(assets);

    const assetsToSearch = allAssets.filter(assetName => {
      return ModuleFilenameHelpers.matchObject.bind(undefined, {
        test: this.options.asset,
      })(assetName);
    });

    assetsToSearch.forEach(assetName => {
      const { source, info } = compilation.getAsset(assetName);
      const assetContent = source.source();

      let assetString = assetContent.toString('utf8');

      this.options.rules.forEach(rule => {
        const searchRegex =
          rule.search instanceof RegExp
            ? rule.search
            : new RegExp(rule.search, 'g');

        const assetToReplace = allAssets.find(asset => {
          if (rule.replace instanceof RegExp) {
            return rule.replace.test(asset);
          }

          return asset === rule.replace;
        });

        if (!assetToReplace) {
          logger.warn(`no asset matches: ${rule.replace}`);
          return;
        }

        const transformedAssetToReplace =
          typeof rule.transform === 'function'
            ? rule.transform(assetToReplace)
            : assetToReplace;

        assetString = assetString.replace(
          searchRegex,
          transformedAssetToReplace
        );
      });

      compilation.updateAsset(assetName, new RawSource(assetString), info);
    });
  }

  apply(compiler) {
    const { Compilation } = compiler.webpack;

    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        assets => {
          this.replace(compiler, compilation, assets);
        }
      );
    });
  }
}

module.exports = ReplaceAssetNameWebpackPlugin;
