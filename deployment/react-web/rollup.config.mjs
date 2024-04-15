import { nodeResolve } from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/@rollup/plugin-node-resolve/dist/cjs/index.js";
import commonjs from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/@rollup/plugin-commonjs/dist/cjs/index.js";
import { babel } from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/@rollup/plugin-babel/dist/cjs/index.js";
import clear from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/rollup-plugin-clear/dist/index.js";
import esbuild from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/rollup-plugin-esbuild/dist/index.mjs";
import css from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/rollup-plugin-import-css/dist/plugin.mjs";
import nodePolyfills from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/rollup-plugin-node-polyfills/dist/index.js";

import mendixCopy from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/rollup-plugin-mendix-copy.mjs";
import mendixResolve from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/rollup-plugin-mendix-resolve.mjs";
import mendixRemoveUnchangedFilesFromBundle from"file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/rollup-plugin-mendix-remove-unchanged-files-from-bundle.mjs";
import generatePrecacheServiceWorker from "file:///Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/generate-precache-serviceworker.mjs";

const JAVASCRIPT_SOURCE_PATH_REGEX = /javascriptsource/;
const PLUGGABLE_WIDGETS_PATH_FILTER = "./widgets/**";

const isProduction = process.env.NODE_ENV === "production";
const shouldGenerateSourceMaps = process.env.SOURCE_MAP_GENERATION === "enabled";

export default {
    input: "index.js",
    watch: {
        clearScreen: false,
    },
    output: {
        dir: "dist",
        format: "es",
        chunkFileNames: "[name].js",
        sourcemap: shouldGenerateSourceMaps,
        minifyInternalExports: isProduction,
        manualChunks(id) {
            if (id.includes("node_modules")) {
                return "commons";
            }
        },
    },
    treeshake: isProduction,
    plugins: [
        mendixResolve(
            "/Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/web-resolutions.json",
            "/Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules",
            "/Users/cosmin/Desktop/mendix/deployment/web/cachetag.txt"
        ),
        nodePolyfills(),
        esbuild({
            sourceMap: shouldGenerateSourceMaps,
            exclude: [JAVASCRIPT_SOURCE_PATH_REGEX, PLUGGABLE_WIDGETS_PATH_FILTER],
            minify: isProduction,
            target: "ES2020",
            define: {
                "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
            },
            loaders: {
                // Enable JSX in .js files too
                ".js": "jsx",
            },
        }),
        ignore(/react-native/),
        nodeResolve({
            modulePaths: ["/Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules"],
        }),
        commonjs({ transformMixedEsModules: true, exclude: [/mendix-web/, PLUGGABLE_WIDGETS_PATH_FILTER] }),
        babel({
            babelHelpers: "bundled",
            include: JAVASCRIPT_SOURCE_PATH_REGEX,
            presets: [
                [
                    "/Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/@babel/preset-env",
                    { targets: { safari: "13" } },
                ],
            ],
            plugins: [
                "/Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/@babel/plugin-syntax-dynamic-import",
                "/Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/babel-plugin-transform-bigint-to-jsbi",
            ],
        }),
        clear({
            targets: ["dist"],
        }),
        css({
            output: "widgets.css",
            alwaysOutput: true,
            minify: isProduction,
        }),
        generatePrecacheServiceWorker({
            deploymentDir: "/Users/cosmin/Desktop/mendix/deployment",
        }),
        mendixCopy({
            targetFolder: "dist",
            sources: [
                {
                    folder: "/Users/cosmin/Desktop/mendix/deployment/web/widgets",
                    exclude: [".js", ".mjs"],
                    include: "**",
                },
                {
                    folder: "/Applications/Studio Pro 10.9.0.31759-Beta.app/Contents/modeler/tools/node/node_modules/@mendix/wa-sqlite/dist/",
                    include: "wa-sqlite-async.wasm"
                },
            ],
        }),
        mendixRemoveUnchangedFilesFromBundle()
    ],
};

function ignore(regex) {
    const emptyFile = "export default {}";
    const emptyFileName = "\0rollup_plugin_ignore_empty_module_placeholder";

    return {
        name: "ignore",
        resolveId(importee) {
            return importee === emptyFileName || regex.test(importee) ? emptyFileName : null;
        },
        load(id) {
            return id === emptyFileName ? emptyFile : null;
        },
    };
}
