import type { BehaviorSubject } from 'rxjs'
import type { ItemFe } from '../settings/interfaces'

export type TableItemFe = ItemFe & {
  highlightInfo?: BehaviorSubject<null | {
    regexMatch?: RegExpExecArray,
    columnName?: string
  }>
}
