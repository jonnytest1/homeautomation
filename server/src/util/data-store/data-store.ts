import type { Action, ActionCreator } from './action'
import { Selector, type SelectorFnc } from './selector'
import { BehaviorSubject, type Observable } from 'rxjs'



type Reducer<S, A extends { type: string }> = (state: S, action: A) => S
type Effect<S, A extends { type: string }> = (state: S, action: A) => (void | Promise<void>)

export class DataStore<T>{

  state: BehaviorSubject<T>


  reducers: Record<string, Reducer<T, { type: string }>> = {}
  effects: Record<string, Effect<T, { type: string }>> = {}

  lastDispatch = -1

  constructor(private initialState: T) {
    this.state = new BehaviorSubject(this.initialState)
  }

  createSelector<R>(s: SelectorFnc<T, R>) {
    return new Selector<T, R>(s, this)
  }

  get(state: T) {
    return state
  }


  pipe(obs: Observable<T>) {
    return obs
  }

  getOnce<R>(selector: Selector<T, R>) {
    return selector.get(this.state.value)
  }

  select<R>(selector: Selector<T, R>) {
    return selector.pipe(this.state)
  }


  addReducer<Type extends string, P>(action: ActionCreator<Type, P>, reducer: Reducer<T, Action<Type, P>>) {
    if (this.reducers[action.type]) {
      throw new Error("duplciate reducer " + action.type)
    }
    this.reducers[action.type] = reducer
  }
  addEffect<Type extends string, P>(action: ActionCreator<Type, P>, effect: Effect<T, Action<Type, P>>) {
    if (this.effects[action.type]) {
      throw new Error("duplciate reducer " + action.type)
    }
    this.effects[action.type] = effect
  }

  dispatch<A extends { type: string }>(action: A) {
    this.lastDispatch = Date.now()
    const lastDispatch = this.lastDispatch
    const reducer = this.reducers[action.type]
    if (!reducer) {
      return
    }
    const newState = reducer(this.state.value, action)

    this.state.next(newState)
    if (lastDispatch === this.lastDispatch) {
      this.effects[action.type]?.(newState, action)
    } else {
      debugger
    }
  }

}