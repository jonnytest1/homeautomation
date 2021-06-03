import * as expressdbwrapper from '../../src/util/express-db-wrapper';
jest.mock("../../src/util/express-db-wrapper")

const { loadOne } = jest.requireActual<typeof expressdbwrapper>('../../src/util/express-db-wrapper')
export const dbwrapper = expressdbwrapper as jest.Mocked<typeof expressdbwrapper>;
dbwrapper.getter.mockImplementation((...args) => {
    // console.log(...args)
    return (...args) => undefined
})
dbwrapper.autosaveable.mockImplementation((...args) => {
    // console.log(...args)
    return undefined
})

dbwrapper.loadOne.mockImplementation(loadOne)