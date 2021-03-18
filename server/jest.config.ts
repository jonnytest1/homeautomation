import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    verbose: true,
    modulePathIgnorePatterns: ["angular", "models/test.ts"]
};
export default config;