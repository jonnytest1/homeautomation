import { createAction, type Action, type ActionCreator } from './action'
import { Selector, type SelectorFnc } from './selector'
import { logKibana } from '../log'
import { BehaviorSubject, map, type Observable } from 'rxjs'



type Reducer<S, A extends { type: string }> = (state: S, action: A) => S
type Effect<S, A extends { type: string }> = (state: S, action: A) => (void | Promise<void>)

export class DataStore<T> {

  state: BehaviorSubject<T>


  reducers: Record<string, Reducer<T, { type: string }>> = {}
  effects: Record<string, Array<Effect<T, { type: string }>>> = {}
  generalEffects: Array<Effect<T, Action<string, unknown>>>

  lastDispatch = -1

  lastAction: Action<string, unknown> | undefined

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
  selectWithAction<R>(selector: Selector<T, R>) {
    return selector.pipe(this.state).pipe(map(st => [st, this.lastAction?.type] as const))
  }
  selectWithCompleteAction<R>(selector: Selector<T, R>) {
    return selector.pipe(this.state).pipe(map(st => [st, this.lastAction] as const))
  }
  addReducer<Type extends string, P>(action: ActionCreator<Type, P>, reducer: Reducer<T, Action<Type, P>>) {
    if (this.reducers[action.type]) {
      throw new Error("duplciate reducer " + action.type)
    }
    this.reducers[action.type] = reducer
  }
  // 
  createReducerAction<Type extends string, P>(actionType: Type, reducer: Reducer<T, Action<Type, P>>, propsCreator?: () => P): ActionCreator<Type, Omit<P, "type">> {
    const action = createAction(actionType, propsCreator)
    this.addReducer(action, reducer)
    return action
  }


  addEffect<Type extends string, P>(action: ActionCreator<Type, P>, effect: Effect<T, Action<Type, P>>) {

    this.effects[action.type] ??= []
    this.effects[action.type].push(effect)
  }
  addGeneralEffect(effect: Effect<T, Action<string, unknown>>) {
    this.generalEffects.push(effect)
  }
  dispatch<A extends Action<string, unknown>>(action: A) {
    this.lastDispatch = Date.now()
    const lastDispatch = this.lastDispatch
    const reducer = this.reducers[action.type]
    if (!reducer) {
      logKibana("ERROR", {
        message: "no reducer for type",
        type: action.type,
        action: action
      })
      return
    }
    const newState = reducer(this.state.value, action)
    if (newState !== this.state.value) {
      this.lastAction = action
      this.state.next(newState)
      this.lastAction = undefined

      if (lastDispatch === this.lastDispatch) {

        this.effects[action.type]?.forEach(effect => {
          effect(newState, action)
        })
      } else {
        console.log("skipping effect after new action dispatch")
        // debugger
      }
    } else {
      console.debug(`action ${action.type} resolved to same state reference`)
    }
  }

}