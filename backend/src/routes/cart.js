import { Router } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { requireClerkAuth } from '../middleware/auth.js'
import { Cart } from '../models/Cart.js'
import { Product } from '../models/Product.js'
import { computeVariantUnitPrice, findVariant } from '../utils/pricing.js'

export const cartRouter = Router()

cartRouter.get('/', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const cart = await Cart.findOne({ userId }).lean()
    res.json(cart ?? { userId, products: [] })
  } catch (e) {
    next(e)
  }
})

const AddSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
  selectedVariantCategory: z.string().optional().default(''),
  selectedSize: z.string().min(1),
  selectedThickness: z.string().min(1),
})

cartRouter.post('/', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const { productId, quantity, selectedVariantCategory, selectedSize, selectedThickness } =
      AddSchema.parse(req.body)
    const cat = String(selectedVariantCategory ?? '').trim()
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Invalid productId' })

    const product = await Product.findById(productId).lean()
    if (!product) return res.status(404).json({ error: 'Product not found' })

    const v = findVariant(product, selectedSize, selectedThickness, cat)
    if (!v) return res.status(400).json({ error: 'Variant not found' })
    const unitPrice = computeVariantUnitPrice(v, selectedSize)

    const snapshot = {
      productId: product._id,
      name: product.productName,
      image: product.thumbnail || product.images?.[0],
      unitPrice,
      quantity,
      selectedVariantCategory: cat,
      selectedSize,
      selectedThickness,
      size: selectedSize,
    }

    const cart = (await Cart.findOne({ userId })) ?? (await Cart.create({ userId, products: [] }))
    const existing = cart.products.find(
      (p) =>
        p.productId.toString() === productId &&
        String(p.selectedVariantCategory ?? '').trim() === cat &&
        (p.selectedSize ?? p.size ?? '') === selectedSize &&
        (p.selectedThickness ?? '') === selectedThickness,
    )
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity)
    else cart.products.push(snapshot)
    await cart.save()
    res.status(201).json(cart)
  } catch (e) {
    next(e)
  }
})

const UpdateSchema = z.object({
  quantity: z.number().int().min(1).max(99),
  selectedSize: z.string().optional(),
  selectedThickness: z.string().optional(),
  selectedVariantCategory: z.string().optional(),
  prevSize: z.string().optional(),
  prevThickness: z.string().optional(),
  prevVariantCategory: z.string().optional(),
})

cartRouter.put('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const productId = req.params.id
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Invalid productId' })

    const {
      quantity,
      selectedSize,
      selectedThickness,
      selectedVariantCategory,
      prevSize,
      prevThickness,
      prevVariantCategory,
    } = UpdateSchema.parse(req.body)
    const cart = await Cart.findOne({ userId })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })

    const pSize = prevSize ?? ''
    const pThick = prevThickness ?? ''
    const pCat = String(prevVariantCategory ?? '').trim()

    const item = cart.products.find(
      (p) =>
        p.productId.toString() === productId &&
        String(p.selectedVariantCategory ?? '').trim() === pCat &&
        (p.selectedSize ?? p.size ?? '') === pSize &&
        (p.selectedThickness ?? '') === pThick,
    )
    if (!item) return res.status(404).json({ error: 'Item not found' })
    item.quantity = quantity
    if (selectedSize !== undefined) {
      item.selectedSize = selectedSize
      item.size = selectedSize
    }
    if (selectedThickness !== undefined) item.selectedThickness = selectedThickness
    if (selectedVariantCategory !== undefined) item.selectedVariantCategory = selectedVariantCategory
    await cart.save()
    res.json(cart)
  } catch (e) {
    next(e)
  }
})

cartRouter.delete('/:id', requireClerkAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const productId = req.params.id
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Invalid productId' })
    const selectedSize = (req.query.selectedSize ?? req.query.size ?? '').toString()
    const selectedThickness = (req.query.selectedThickness ?? '').toString()
    const selectedVariantCategory = String(req.query.selectedVariantCategory ?? '').trim()

    const cart = await Cart.findOne({ userId })
    if (!cart) return res.status(404).json({ error: 'Cart not found' })
    cart.products = cart.products.filter(
      (p) =>
        !(
          p.productId.toString() === productId &&
          String(p.selectedVariantCategory ?? '').trim() === selectedVariantCategory &&
          (p.selectedSize ?? p.size ?? '') === selectedSize &&
          (p.selectedThickness ?? '') === selectedThickness
        ),
    )
    await cart.save()
    res.json(cart)
  } catch (e) {
    next(e)
  }
})
