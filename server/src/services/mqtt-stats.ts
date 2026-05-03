import { logKibana } from '../util/log'


type DiskIO = {

}


type DeviceOsStats = {
  cpu: {}
  diskusage: {
    percent: number
  }
  diskio: {
    [key: `ram${number}`]: DiskIO
    [key: `loop${number}`]: DiskIO
    [key: `mm${string}`]: DiskIO
  }
  net: {
    wlan0: {
      dropout: number
    }
  }
  timestamp: string
}

const stats: { [devicekey: string]: Array<DeviceOsStats> } = {}


export function updateOsStats(statsString: string, deviceId: string) {
  const osStats = JSON.parse(statsString) as DeviceOsStats
  stats[deviceId] ??= []
  stats[deviceId].push(osStats)


  while (stats[deviceId].length > 2) {
    stats[deviceId].shift()
  }

  const dropDiffs: Array<number> = []
  if (Object.keys(stats).length > 2) {

    let allHaveNetworkDrops = true;

    for (const statKey of Object.keys(stats)) {
      const statList = stats[statKey]
      const last = statList.at(-1)

      if (last) {
        if (last.diskusage.percent > 80) {
          logKibana("ERROR", {
            message: "device diskusage > 80",
            device: statKey,
            stats: last
          })
        }

        if (statList.length > 1) {
          const prev = statList.at(-2)
          if (prev) {

            const timeDiff = +new Date(last.timestamp) - +new Date(prev.timestamp)

            const dropDiff = last.net.wlan0.dropout - prev.net.wlan0.dropout

            dropDiffs.push(dropDiff)
            if (timeDiff < (1000 * 5) || dropDiff == 0) {
              allHaveNetworkDrops = false
            }
          } else {
            allHaveNetworkDrops = false
          }
        } else {
          allHaveNetworkDrops = false
        }
      } else {
        allHaveNetworkDrops = false
      }
    }
    if (allHaveNetworkDrops) {
      logKibana("ERROR", {
        message: "there seem to be network drops across multiple devices - consider restarting the router",
        dropDiffs,
        stats
      })
    }
  } else {
    logKibana("INFO", {
      message: "not enouogh data for OsStats network drops check",
      dropDiffs,
      stats
    })
  }


}