import { SafeUrl } from '@angular/platform-browser';
import { Sound as BeSound } from "../../../../../models/sound"

export interface Sound extends BeSound {
    url?: SafeUrl

    file?: File

    resolver: Promise<void>
}