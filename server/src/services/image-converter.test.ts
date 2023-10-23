import { imageLaoder } from './image-converter'


describe("image-laoder", () => {
  it("laods image", async () => {
    const url = await imageLaoder("https://m.media-amazon.com/images/I/41+m3YJQoTL._SCLZZZZZZZ__SY500_SX500_.jpg")
    debugger
  })
})