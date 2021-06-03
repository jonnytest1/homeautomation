import { Sound as BeSound } from "../../../../../src/models/sound"
import { SafeUrl } from '@angular/platform-browser';

export interface Sound extends BeSound {
    url?: SafeUrl

    file?: File

    resolver: Promise<void>
}