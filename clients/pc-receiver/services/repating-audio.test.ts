import { TextReader } from './read-text'
import { RepeatingAudio } from './repeating-audio-player';

describe("audio", () => {
  it("runs", () => {
    const audio = new RepeatingAudio("bell");
    setTimeout(() => {
      audio.stop()
    }, 1000)
  })
})