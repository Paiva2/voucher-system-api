import { StoreItem, StoreItemInsert } from "../@types/types"
import { StoreItemRepository } from "../repositories/StoreItemRepository"
import { randomUUID } from "node:crypto"

export default class InMemoryStoreItem implements StoreItemRepository {
  private storeItems = [] as StoreItem[]

  async insert(newItemList: StoreItemInsert[]) {
    const newItemListFormatted = []

    for (let item of newItemList) {
      const itemToInsert = {
        id: randomUUID(),
        item_name: item.itemName,
        value: item.value,
        quantity: item.quantity,
        item_image: item.itemImage ?? null,
        description: item.description,
        created_at: new Date(),
        updated_at: new Date(),
        promotion: item.promotion ?? false,
        promotional_value: item.promotion ? item.promotionalValue : null,
        fkstore_id: item.storeId,
        fkstore_coin: item.storeCoin,
        colors: item.colors,
        sizes: item.sizes,
      }

      this.storeItems.push(itemToInsert)
      newItemListFormatted.push(itemToInsert)
    }

    return newItemListFormatted
  }

  async findStoreItems(storeId: string, storeCoinName: string, page = null) {
    let storeItems = [] as StoreItem[]

    for (let item of this.storeItems) {
      if (item.fkstore_id === storeId && item.fkstore_coin === storeCoinName) {
        storeItems.push(item)
      }
    }

    if (page) {
      return storeItems.splice((page - 1) * 10, page * 10)
    }

    return storeItems
  }

  async findStoreItem(storeId: string, itemId: string) {
    const storeItem = this.storeItems.find(
      (item) => item.id === itemId && item.fkstore_id === storeId
    )

    if (!storeItem) return null

    return storeItem
  }

  async updateItemQuantityToUserPurchase(
    storeId: string,
    itemId: string,
    valueToSubtract: number
  ) {
    let updatedItem: StoreItem

    const updatedStoreItems = this.storeItems.map((item) => {
      if (item.fkstore_id === storeId && item.id === itemId) {
        item = {
          ...item,
          quantity: item.quantity - valueToSubtract,
        }

        updatedItem = item
      }

      return item
    })

    this.storeItems = updatedStoreItems

    return updatedItem
  }
}