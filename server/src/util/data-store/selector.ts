import type { DataStore } from './data-store'
import { distinctUntilChanged, map, type Observable } from 'rxjs'


export type SelectorFnc<S, R> = (state: S) => R


export class Selector<T, R> {
  constructor(private mappingFunction: SelectorFnc<T, R>, private parent: Selector<any, T> | DataStore<T>) {

  }


  chain<S extends SelectorFnc<R, unknown>>(s: S): Selector<T, ReturnType<S>> {
    return new Selector(s, this) as unknown as Selector<T, ReturnType<S>>
  }


  get(state: T): R {
    return this.mappingFunction(this.parent.get(state))
  }

  pipe(state: Observable<T>): Observable<R> {
    return this.parent.pipe(state)
      .pipe(
        map(st => this.mappingFunction(st)),
        distinctUntilChanged()
      )
  }
}