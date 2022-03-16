import type { Sound as BeSound } from "../../../../../src/models/sound"
import type { SafeUrl } from '@angular/platform-browser';

export interface Sound extends BeSound {
  url?: SafeUrl

  file?: File

  resolver: Promise<void>
}