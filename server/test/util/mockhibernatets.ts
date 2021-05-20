import * as hibernate from 'hibernatets';

jest.mock("hibernatets")

export const hibernatetsMock = hibernate as jest.Mocked<typeof hibernate>;
hibernatetsMock.column.mockImplementation((...args) => {
    //console.trace(...args)
    return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {
        // console.log(`mocking ${propertyKey} in ${target.constructor.name}`)
    }
})
hibernatetsMock.primary.mockImplementation((...args) => {
    // console.log(...args)
    return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => undefined
})
hibernatetsMock.table.mockImplementation((...args) => {
    // console.log(...args)
    return (...args) => undefined
})
hibernatetsMock.mapping.mockImplementation((...args) => {
    // console.log(...args)
    return (...args) => undefined
})

hibernatetsMock.queries.mockImplementation((...args) => {
    return new Promise((resolver, catcher) => {
        //unneccessary for now
    })
})