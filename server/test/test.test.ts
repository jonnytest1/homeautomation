describe("randomtest", () => {

    it("tests something unrelated", () => {
        const buf = Buffer.from(`test`)
        //const obj = JSON.parse(buf as any);
        debugger;
        const ab = new RegExp("t(.*?)s", "g").test(buf as any)
        const abc = new RegExp("asdf", "g").test(buf as any)
    })
})