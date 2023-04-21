/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {

    // see https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        '^.+\\.[tj]sx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
}
