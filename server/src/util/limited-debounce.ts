import { Subject, type Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

export function limitedDebounce<T>(debounceTimeMs: number, limitMs: number) {
  return (source: Observable<T>): Observable<T> => {

    let lastEmitTs: number = Date.now()
    const evt = new Subject<T>()
    let emitTimeout: NodeJS.Timeout | undefined

    return source.pipe(tap(event => {
      if (emitTimeout) {
        if ((Date.now() - lastEmitTs) < limitMs) {
          clearTimeout(emitTimeout)
        }
      }
      emitTimeout = setTimeout(() => {
        emitTimeout = undefined
        lastEmitTs = Date.now()
        evt.next(event)
      }, debounceTimeMs)
      return true

    }),
      switchMap(() => evt)
    )
  }


}