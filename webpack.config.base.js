/* global __dirname */

const webpack = require('webpack');
const process = require('process');

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const analyzeBundle = process.argv.indexOf('--analyze-bundle') !== -1;

const childProcess = require('child_process');
const commitHash = childProcess.execSync('git rev-parse HEAD').toString();
const localChanges = childProcess.execSync('git status --porcelain | wc -l');

const minimize
    = process.argv.indexOf('-p') !== -1
        || process.argv.indexOf('--optimize-minimize') !== -1;

const config = {
    devtool: 'source-map',
    mode: minimize ? 'production' : 'development',
    module: {
        rules: [ {
            // Version this build of the lib-jitsi-meet library.

            loader: 'string-replace-loader',
            options: {
                flags: 'g',
                replace:
                    process.env.LIB_JITSI_MEET_COMMIT_HASH || 'development',
                search: '{#COMMIT_HASH#}'
            },
            test: `${__dirname}/JitsiMeetJS.js`
        }, {
            // Transpile ES2015 (aka ES6) to ES5.

            exclude: [
                new RegExp(`${__dirname}/node_modules/(?!@jitsi/js-utils)`)
            ],
            loader: 'babel-loader',
            options: {
                presets: [
                    [
                        '@babel/preset-env',

                        // Tell babel to avoid compiling imports into CommonJS
                        // so that webpack may do tree shaking.
                        {
                            modules: false,

                            // Specify our target browsers so no transpiling is
                            // done unnecessarily. For browsers not specified
                            // here, the ES2015+ profile will be used.
                            targets: {
                                chrome: 58,
                                electron: 2,
                                firefox: 54,
                                safari: 11
                            }
                        }
                    ],
                    '@babel/preset-flow'
                ],
                plugins: [
                    '@babel/plugin-transform-flow-strip-types',
                    '@babel/plugin-proposal-class-properties',
                    '@babel/plugin-proposal-export-namespace-from'
                ]
            },
            test: /\.js$/
        } ]
    },
    node: {
        // Allow the use of the real filename of the module being executed. By
        // default Webpack does not leak path-related information and provides a
        // value that is a mock (/index.js).
        __filename: true
    },
    optimization: {
        concatenateModules: minimize
    },
    entry: {
        'lib-jitsi-meet': './index.js'
    },
    output: {
        filename: `[name]${minimize ? '.min' : ''}.js`,
        path: process.cwd(),
        sourceMapFilename: `[name].${minimize ? 'min' : 'js'}.map`,
        library: 'JitsiMeetJS',
        libraryTarget: 'umd'
    },
    externals: {
        'strophe.js': 'window'
    },
    performance: {
        hints: minimize ? 'error' : false,
        maxAssetSize: 750 * 1024,
        maxEntrypointSize: 750 * 1024
    },
    plugins: [
        analyzeBundle
            && new BundleAnalyzerPlugin({
                analyzerMode: 'disabled',
                generateStatsFile: true
            }),
        new webpack.BannerPlugin({
            banner: `built from: https://github.com/kecskesk/lib-jitsi-meet - commit:
                    ${commitHash.replace(/\n/g, '')}${localChanges > 0 ? ' - DIRTY' : ''}`
        })
    ].filter(Boolean)
};

module.exports = config;
