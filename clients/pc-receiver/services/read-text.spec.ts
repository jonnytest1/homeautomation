import { TextReader } from './read-text'

describe("speak", () => {
  it("speaks", () => {
    new TextReader({
      text: "test"
    }).read();
  })
})