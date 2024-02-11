import { GoogleCharts } from 'google-charts';



interface DrawOptinos {
  vAxis?
  animation

  title?: string
}

export interface BaseChart {
  draw: (data: DataTable, options: Partial<DrawOptinos>) => void
}

/**
 * https://developers.google.com/chart/interactive/docs/gallery/combochart?hl=de
 */
interface ComboChartDrawOptinos extends DrawOptinos {

  /**
   * Der Typ der Markierung für diese Reihe. Gültige Werte sind „line“, „area“, „bars“, „candlesticks“ und „steppedArea“. Balken sind eigentlich vertikale Balken (Spalten). 
   * Der Standardwert wird durch die Option seriesType des Diagramms angegeben.
   */
  seriesType: 'bars' | "scatter" | "line" | "area"

  pointSize
  series
}


export interface ComboChartInstance extends BaseChart {
  draw: (data: DataTable, options: Partial<ComboChartDrawOptinos>) => void

}

interface LineChartDrawOptinos extends DrawOptinos {

  curveType?: "function"
}


export interface LineChartInstance extends BaseChart {
  draw: (data: DataTable, options: Partial<LineChartDrawOptinos>) => void

}
export interface DataTable {

}

export const GoogleChartImport = GoogleCharts as {
  load: (onload: () => void) => void
  api: {
    visualization: {
      ComboChart: new (el: HTMLElement) => ComboChartInstance
      SteppedAreaChart: new (el: HTMLElement) => BaseChart
      LineChart: new (el: HTMLElement) => LineChartInstance

      arrayToDataTable: (data: Array<Array<unknown>>) => DataTable
    }
  }
}