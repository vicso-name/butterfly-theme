'use strict';

const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'script',
            globals: {
                document: 'readonly',
                window: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                fetch: 'readonly',
                MutationObserver: 'readonly',
                DOMParser: 'readonly',
            },
        },
        rules: {
            // console.error() is used intentionally in replaceImagesWithInlineSVGs()
            // to report SVG fetch failures — not a debugging leftover
            'no-console': 'off',
        },
    },
];
