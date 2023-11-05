import prisma from "../../lib/prisma"
import { StoreItemInsert, StoreItem } from "../@types/types"
import { StoreItemRepository } from "../repositories/StoreItemRepository"
import { randomUUID } from "node:crypto"

export default class PgStoreItem implements StoreItemRepository {
  private schema = process.env.DATABASE_SCHEMA

  async insert(newItemList: StoreItemInsert[]) {
    const queriesArr = []
    const storeId = newItemList[0].storeId

    for (let item of newItemList) {
      const uuid = randomUUID()

      queriesArr.push([
        `('${uuid}', '${item.itemName}', '${item.value}', '${item.quantity}', '${
          item.itemImage ?? ""
        }', '${item.description}','${item.storeId}', '${item.storeCoin}', '${
          item.promotion ?? false
        }', '${item.promotionalValue ?? 0}', '${item.colors}', '${item.sizes}')`,
      ])
    }

    const formatQueryValues = queriesArr.toString()

    const itemList = await prisma.$queryRawUnsafe<StoreItem[]>(
      `
        INSERT INTO "${this.schema}".store_item
        (id, item_name, value, quantity, item_image, description, 
        fkstore_id, fkstore_coin, promotion, promotional_value, colors, sizes)
        VALUES ${formatQueryValues}
        RETURNING *
    `,
      storeId
    )

    return itemList
  }

  async findStoreItems(storeId: string, storeCoinName: string, page = null) {
    let itemList = [] as StoreItem[]

    if (page) {
      itemList = await prisma.$queryRawUnsafe<StoreItem[]>(
        `
        WITH get_list AS (
          SELECT * FROM "${this.schema}".store_item
          WHERE fkstore_id = $1 AND fkstore_coin = $2
        )
          SELECT * FROM get_list
          ORDER BY created_at
          OFFSET $3 LIMIT $4
     `,
        storeId,
        storeCoinName,
        (page - 1) * 10,
        10
      )

      return itemList
    }

    itemList = await prisma.$queryRawUnsafe<StoreItem[]>(
      `
       SELECT * FROM "${this.schema}".store_item
       WHERE fkstore_id = $1 AND fkstore_coin = $2
   `,
      storeId,
      storeCoinName
    )

    return itemList
  }

  async findStoreItem(storeId: string, itemId: string) {
    const [storeItem] = await prisma.$queryRawUnsafe<StoreItem[]>(
      `
      SELECT * FROM "${this.schema}".store_item
      WHERE fkstore_id = $1 AND id = $2
      `,
      storeId,
      itemId
    )

    if (!storeItem) return null

    return storeItem
  }

  async updateItemQuantityToUserPurchase(
    storeId: string,
    itemId: string,
    valueToSubtract: number
  ) {
    try {
      await prisma.$queryRawUnsafe(`BEGIN`)

      await prisma.$queryRawUnsafe(`savepoint pre_purchase_store_item`)

      const [storeItem] = await prisma.$queryRawUnsafe<StoreItem[]>(
        `
        WITH current_value AS (
          SELECT * FROM "${this.schema}".store_item
          WHERE fkstore_id = $1 AND id = $2
        ),
        updated_value AS (
          UPDATE "${this.schema}".store_item
          SET quantity = (SELECT quantity FROM current_value) - CAST($3 AS integer)
          WHERE fkstore_id = $1 AND id = $2
          RETURNING *
        )
          
          SELECT * FROM updated_value
        `,
        storeId,
        itemId,
        valueToSubtract
      )

      return storeItem
    } catch {
      throw {
        status: 500,
        error: "Internal Error.",
      }
    }
  }
}