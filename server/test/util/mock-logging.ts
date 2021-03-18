import * as logging from '../../util/log';

jest.mock('../../util/log')

export const mockedLogging = logging as jest.Mocked<typeof logging>;

mockedLogging.logKibana.mockImplementation(async (level, ...args) => {
    if (level == "ERROR") {
        throw args
    }
})