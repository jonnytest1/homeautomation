export interface ShortcutAction {
  name?: string
  displayText?: string
}

export interface ShortcutReceiver {
  deviceKey: string

  name?: string

  actions?: Array<ShortcutAction>

  events?: Array<never>
}
