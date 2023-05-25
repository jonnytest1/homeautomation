

export interface BaseConfig {
  receiver: string
}


export interface ActiopnConfig extends BaseConfig {
  actionName: string
}

export interface ProgressConfig extends BaseConfig {
  type: "progress"

  percent: number

  subtitle?: string
}
export interface ButtonConfig extends ActiopnConfig {
  type: "button"

  displayText: string

  confirm?: boolean
}


export type Configs = ButtonConfig | ProgressConfig