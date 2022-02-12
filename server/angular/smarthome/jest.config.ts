import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    verbose: true,
    modulePathIgnorePatterns: ["models/test.ts"],
    testRegex: ".*.test.ts"
};
export default config;