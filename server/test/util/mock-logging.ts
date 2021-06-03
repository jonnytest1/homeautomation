import * as logging from '../../src/util/log';

jest.mock('../../src/util/log')

export const mockedLogging = logging as jest.Mocked<typeof logging>;

mockedLogging.logKibana.mockImplementation(async (level, ...args) => {
    if (level == "ERROR") {
        throw args
    }
})