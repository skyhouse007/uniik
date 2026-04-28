import { Router } from 'express'
import mongoose from 'mongoose'
import { Category } from '../models/Category.js'
import { z } from 'zod'
import { requireAdminToken } from '../middleware/adminAuth.js'

function isObjectIdString(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id
}

export const categoriesRouter = Router()

categoriesRouter.get('/', async (req, res, next) => {
  try {
    const items = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean()
    res.json({ items })
  } catch (e) {
    next(e)
  }
})

const CategorySchema = z.object({
  name: z.string().min(2),
  image: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
})

async function nextSortOrderForParent(parentId) {
  const filter =
    parentId == null || parentId === ''
      ? { $or: [{ parentId: null }, { parentId: { $exists: false } }] }
      : { parentId }
  const last = await Category.findOne(filter).sort({ sortOrder: -1 }).select('sortOrder').lean()
  return (last?.sortOrder ?? -1) + 1
}

categoriesRouter.post('/', requireAdminToken, async (req, res, next) => {
  try {
    const data = CategorySchema.parse(req.body)
    const pid = data.parentId || null
    const sortOrder = await nextSortOrderForParent(pid)
    const created = await Category.create({
      name: data.name,
      image: data.image,
      parentId: pid,
      sortOrder,
    })
    res.status(201).json(created)
  } catch (e) {
    next(e)
  }
})

const ReorderSchema = z.object({
  parentId: z.union([z.string(), z.null()]).optional(),
  orderedIds: z.array(z.string()).min(1),
})

/** Mounted in `app.js` as `POST /api/categories/reorder` so Express 5 always matches (not lost on sub-routers). */
export async function postCategoriesReorder(req, res, next) {
  try {
    const data = ReorderSchema.parse(req.body)
    let normParent = data.parentId === undefined ? null : data.parentId
    if (normParent === '') normParent = null

    const filter =
      normParent == null
        ? { $or: [{ parentId: null }, { parentId: { $exists: false } }] }
        : { parentId: normParent }

    const existing = await Category.find(filter).select('_id').lean()
    const idSet = new Set(existing.map((e) => String(e._id)))
    if (existing.length !== data.orderedIds.length) {
      return res.status(400).json({ error: 'orderedIds must include every category in this group' })
    }
    for (const id of data.orderedIds) {
      if (!idSet.has(id)) return res.status(400).json({ error: 'Invalid or mixed category list' })
    }

    await Promise.all(
      data.orderedIds.map((id, index) => Category.findByIdAndUpdate(id, { sortOrder: index })),
    )
    const items = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean()
    res.json({ items })
  } catch (e) {
    next(e)
  }
}

categoriesRouter.put('/:id', requireAdminToken, async (req, res, next) => {
  try {
    if (!isObjectIdString(req.params.id)) {
      return res.status(404).json({ error: 'Category not found' })
    }
    const data = CategorySchema.partial().parse(req.body)
    const patch = { ...data }
    if (Object.prototype.hasOwnProperty.call(data, 'parentId')) {
      patch.parentId = data.parentId || null
      if (patch.parentId !== undefined) {
        const doc = await Category.findById(req.params.id).lean()
        if (doc && String(doc.parentId ?? '') !== String(patch.parentId ?? '')) {
          patch.sortOrder = await nextSortOrderForParent(patch.parentId)
        }
      }
    }
    const updated = await Category.findByIdAndUpdate(req.params.id, patch, { new: true })
    if (!updated) return res.status(404).json({ error: 'Category not found' })
    res.json(updated)
  } catch (e) {
    next(e)
  }
})

categoriesRouter.delete('/:id', requireAdminToken, async (req, res, next) => {
  try {
    if (!isObjectIdString(req.params.id)) {
      return res.status(404).json({ error: 'Category not found' })
    }
    const deleted = await Category.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Category not found' })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

