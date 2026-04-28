import { connectDb } from '../config/db.js'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { Coupon } from '../models/Coupon.js'

function finalizeProduct(p) {
  const variants = p.variants.map((v) => ({
    ...v,
    finalPrice: Math.max(0, Math.round(v.price - (v.price * (v.discountPercentage || 0)) / 100)),
  }))
  const fps = variants.map((v) => v.finalPrice)
  return { ...p, variants, minFinalPrice: Math.min(...fps), maxFinalPrice: Math.max(...fps) }
}

async function run() {
  await connectDb()

  await Promise.all([Category.deleteMany({}), Product.deleteMany({}), Coupon.deleteMany({})])

  const categories = await Category.insertMany([
    {
      name: 'Memory Foam',
      image: 'https://res.cloudinary.com/demo/image/upload/v1699999999/memory-foam.jpg',
      sortOrder: 0,
    },
    {
      name: 'Latex',
      image: 'https://res.cloudinary.com/demo/image/upload/v1699999999/latex.jpg',
      sortOrder: 1,
    },
    {
      name: 'Hybrid',
      image: 'https://res.cloudinary.com/demo/image/upload/v1699999999/hybrid.jpg',
      sortOrder: 2,
    },
    {
      name: 'Orthopedic',
      image: 'https://res.cloudinary.com/demo/image/upload/v1699999999/orthopedic.jpg',
      sortOrder: 3,
    },
  ])

  const byName = Object.fromEntries(categories.map((c) => [c.name, c]))

  const img1 = 'https://res.cloudinary.com/demo/image/upload/v1699999999/mattress-1.jpg'
  const img2 = 'https://res.cloudinary.com/demo/image/upload/v1699999999/mattress-2.jpg'
  const img3 = 'https://res.cloudinary.com/demo/image/upload/v1699999999/mattress-3.jpg'

  const rawProducts = [
    {
      productName: 'CozyFoam Cloud 8" Memory Foam Mattress',
      modelName: 'Cloud 8',
      category: byName['Memory Foam']._id,
      shortDescription: 'Soft top layer with medium support for back and side sleepers.',
      fullDescription:
        'Soft top layer with medium support. Great for back and side sleepers with pressure relief and breathability. Multi-layer foam core with breathable knitted cover.',
      images: [img1, img2],
      thumbnail: img1,
      variants: [
        {
          size: '72x48',
          thickness: '6 inch',
          price: 18999,
          discountPercentage: 20,
          stock: 12,
          isPopular: false,
        },
        {
          size: '72x60',
          thickness: '8 inch',
          price: 22999,
          discountPercentage: 18,
          stock: 8,
          isPopular: true,
        },
        {
          size: '78x72',
          thickness: '8 inch',
          price: 28999,
          discountPercentage: 15,
          stock: 6,
          isPopular: false,
        },
      ],
      specifications: [
        { title: 'Material', value: 'Memory foam' },
        { title: 'Comfort Level', value: 'Medium' },
        { title: 'Cover', value: 'Breathable knitted fabric' },
      ],
      deliverablePincodes: [
        { pincode: '560001', deliveryDays: 3 },
        { pincode: '560037', deliveryDays: 5 },
        { pincode: '110001', deliveryDays: 4 },
      ],
      warrantyPeriod: '10 Years',
      deliveryTimeline: '3–5 business days (metro)',
      returnPolicy: '100-night trial. Free returns in original condition.',
      brand: 'CozyFoam',
      rating: 4.6,
      firmness: 'medium',
      popularity: 92,
      promoBadgeType: 'best_seller',
      promoBadgeText: 'Best Seller',
    },
    {
      productName: 'CozyFoam OrthoPro 10" Orthopedic Mattress',
      modelName: 'OrthoPro 10',
      category: byName['Orthopedic']._id,
      shortDescription: 'Firm orthopedic support with enhanced edge stability.',
      fullDescription:
        'Firm orthopedic support with enhanced edge stability. Ideal for spine alignment and long-lasting comfort. High-density core with quilted top.',
      images: [img3],
      thumbnail: img3,
      variants: [
        {
          size: '72x48',
          thickness: '8 inch',
          price: 24999,
          discountPercentage: 15,
          stock: 10,
          isPopular: true,
        },
        {
          size: '78x72',
          thickness: '10 inch',
          price: 31999,
          discountPercentage: 12,
          stock: 5,
          isPopular: false,
        },
      ],
      specifications: [
        { title: 'Material', value: 'High-density foam' },
        { title: 'Comfort Level', value: 'Firm' },
        { title: 'Support', value: 'Ortho spine support layer' },
      ],
      deliverablePincodes: [
        { pincode: '560001', deliveryDays: 4 },
        { pincode: '400001', deliveryDays: 5 },
      ],
      warrantyPeriod: '10 Years',
      deliveryTimeline: '4–7 business days',
      returnPolicy: '30-day return window on unused products.',
      brand: 'CozyFoam',
      rating: 4.5,
      firmness: 'firm',
      popularity: 85,
      promoBadgeType: 'trial_100_nights',
      promoBadgeText: '100-Night Trial',
    },
    {
      productName: 'Nimbus Hybrid 12" Pocket Spring Mattress',
      modelName: 'Nimbus Hybrid 12',
      category: byName['Hybrid']._id,
      shortDescription: 'Pocket springs + comfort foam for bounce and airflow.',
      fullDescription:
        'Hybrid build with pocket springs + comfort foam for bounce, airflow, and pressure relief across sleeping positions.',
      images: [img2],
      thumbnail: img2,
      variants: [
        {
          size: '72x60',
          thickness: '10 inch',
          price: 32999,
          discountPercentage: 25,
          stock: 7,
          isPopular: true,
        },
        {
          size: '78x72',
          thickness: '12 inch',
          price: 38999,
          discountPercentage: 22,
          stock: 4,
          isPopular: false,
        },
      ],
      specifications: [
        { title: 'Core', value: 'Pocket springs' },
        { title: 'Comfort', value: 'Gel-infused foam' },
        { title: 'Comfort Level', value: 'Medium firm' },
      ],
      deliverablePincodes: [{ pincode: '560001', deliveryDays: 5 }],
      warrantyPeriod: '10 Years',
      deliveryTimeline: '5–8 business days',
      returnPolicy: 'Returns within 14 days if unopened.',
      brand: 'Nimbus',
      rating: 4.4,
      firmness: 'medium',
      popularity: 73,
      promoBadgeType: 'extra_offer',
      promoBadgeText: 'Extra 5% at checkout',
    },
    {
      productName: 'GreenRest Natural Latex 8" Mattress',
      modelName: 'GreenRest Latex 8',
      category: byName['Latex']._id,
      shortDescription: 'Naturally responsive latex with cool sleep surface.',
      fullDescription:
        'Naturally responsive latex feel with cool sleep surface. Great motion isolation and durability.',
      images: [img1],
      thumbnail: img1,
      variants: [
        {
          size: '72x48',
          thickness: '6 inch',
          price: 35999,
          discountPercentage: 10,
          stock: 5,
          isPopular: false,
        },
        {
          size: '72x60',
          thickness: '8 inch',
          price: 41999,
          discountPercentage: 10,
          stock: 3,
          isPopular: true,
        },
      ],
      specifications: [
        { title: 'Material', value: 'Natural latex' },
        { title: 'Cover', value: 'Organic cotton blend' },
      ],
      deliverablePincodes: [
        { pincode: '560001', deliveryDays: 6 },
        { pincode: '560037', deliveryDays: 7 },
      ],
      warrantyPeriod: '7 Years',
      deliveryTimeline: '6–10 business days',
      returnPolicy: '30-day comfort guarantee.',
      brand: 'GreenRest',
      rating: 4.3,
      firmness: 'soft',
      popularity: 61,
      promoBadgeType: 'custom',
      promoBadgeText: 'Eco choice',
    },
  ]

  await Product.insertMany(rawProducts.map(finalizeProduct))

  await Coupon.insertMany([
    { code: 'SLEEP10', type: 'percent', value: 10, minSubtotal: 0, active: true },
    { code: 'COZY15', type: 'percent', value: 15, minSubtotal: 15000, active: true },
  ])

  // eslint-disable-next-line no-console
  console.log('Seeded categories, products, coupons.')
  process.exit(0)
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
