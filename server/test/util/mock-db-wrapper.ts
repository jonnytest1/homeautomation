import * as expressdbwrapper from 'express-hibernate-wrapper';
jest.mock("express-hibernate-wrapper")

const { loadOne } = jest.requireActual<typeof expressdbwrapper>('express-hibernate-wrapper')
export const dbwrapper = expressdbwrapper as jest.Mocked<typeof expressdbwrapper>;
dbwrapper.getter.mockImplementation((...args) => {
    // console.log(...args)
    return (...args) => undefined
})
dbwrapper.POST.mockImplementation((...args) => {
    return (...args) => () => undefined
})
dbwrapper.GET.mockImplementation((...args) => {
    return (...args) => () => undefined
})
dbwrapper.Path.mockImplementation((...args) => {
    return (...args) => undefined
})
dbwrapper.settable.mockImplementation(() => undefined)

dbwrapper.autosaveable.mockImplementation((...args) => {
    // console.log(...args)
    return undefined
})
dbwrapper.WS.mockImplementation((...args) => {
    return () => undefined
})
dbwrapper.loadOne.mockImplementation(loadOne)