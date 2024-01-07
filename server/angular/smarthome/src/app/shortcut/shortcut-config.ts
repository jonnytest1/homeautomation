

export interface BaseConfig {
  receiver: string
}


export interface ActiopnConfig extends BaseConfig {
  actionName: string,
  uuid: string
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

  backgroundConfig?: DiagramConfig
}
export interface DiagramConfig extends ActiopnConfig {
  type: "diagram"
}

export type Configs = ButtonConfig | ProgressConfig | DiagramConfig