import { Router } from 'express'
import { Product } from '../models/Product.js'

export const searchRouter = Router()

searchRouter.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q ?? '').toString().trim()
    if (!q) return res.json({ items: [] })

    const items = await Product.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' }, popularity: -1 })
      .limit(24)
      .lean()

    res.json({ items })
  } catch (e) {
    next(e)
  }
})

