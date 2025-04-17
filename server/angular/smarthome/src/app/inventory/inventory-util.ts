import type { ItemFe } from '../settings/interfaces'

export function getProductId(item: ItemFe) {
  if (item.productLink?.includes("/product/")) {
    return item.productLink?.split("/product/")?.[1] ?? ''

  } else if (item.productLink?.includes("/dp/")) {
    return item.productLink?.split("/dp/")?.[1] ?? ''
  } else if (item.productLink?.includes("/item/")) {
    return item.productLink?.split("/item/")?.[1].split(".html")[0] ?? ''
  }

}
