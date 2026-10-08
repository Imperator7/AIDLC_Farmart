/** A product as the UI uses it; the API's `Product` (openapi.yaml) adds `categorySlug`, `discountPercent` and `inStock`. */
export type Product = {
  id: string
  brand: string
  name: string
  category: string
  categorySlug?: string
  unit: string
  price: number
  /** Price before the discount; absent or null when not on sale. */
  oldPrice?: number | null
  rating: number
  reviews: number
  image: string
  /** Units sold from `stock` in the current Top Saver deal. */
  sold?: number
  /** Units in stock (for a deal, its allocation); `stock − sold` are left. */
  stock?: number
}

/** Category as served by GET /api/categories. */
export type Category = {
  slug: string
  name: string
  image: string
  productCount?: number
}

export type BannerPlacement = 'hero' | 'hero-side' | 'promo' | 'brand'

/** Banner as served by GET /api/banners. */
export type Banner = {
  id: string
  placement: BannerPlacement
  eyebrow?: string | null
  title: string
  subtitle?: string | null
  brand?: string | null
  image: string
  imageAlt: string
  href: string
  ctaLabel?: string | null
}

/** GET /api/search/suggestions */
export type SearchSuggestions = {
  query: string
  products: { id: string; name: string; image: string; price: number }[]
  categories: { slug: string; name: string }[]
}

/** "Fruits & Vegetables" → "fruits-vegetables" */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Unsplash photo URL, pre-cropped so next/image doesn't fetch the multi-megapixel original. */
const photo = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&fit=crop&auto=format`

const categoryList = [
  { name: 'Fruits & Vegetables', image: photo('photo-1597362925123-77861d3fbac7', 400) },
  { name: 'Breads & Sweets', image: photo('photo-1608198093002-ad4e005484ec', 400) },
  { name: 'Frozen Seafoods', image: photo('photo-1548587468-971ebe4c8c3b', 400) },
  { name: 'Raw Meats', image: photo('photo-1603048297172-c92544798d5a', 400) },
  { name: 'Wines & Alcohol Drinks', image: photo('photo-1578911373434-0cb395d2cbfb', 400) },
  { name: 'Coffees & Teas', image: photo('photo-1587734195503-904fca47e0e9', 400) },
  { name: 'Milks & Dairies', image: photo('photo-1628088062854-d1870b4553da', 400) },
  { name: 'Pet Foods', image: photo('photo-1589924691995-400dc9ecc119', 400) },
]

export const categories: Category[] = categoryList.map((c) => ({
  slug: slugify(c.name),
  ...c,
}))

export const sectionTabs = [
  'All',
  'Fruits & Vegetables',
  'Frozen Seafoods',
  'Raw Meats',
  'Breads & Sweets',
  'Milks & Dairies',
  'Pet Foods',
]

/** Home banners: the hero, the side promo and the Featured Brands cards. Seeded into the database. */
export const banners: Banner[] = [
  {
    id: 'bnr_hero_juice',
    placement: 'hero',
    eyebrow: 'Summer Fresh',
    title: 'Cold-Pressed Orange Juice 1L',
    subtitle:
      '100% squeezed from ripe oranges. No added sugar, delivered chilled.',
    image: photo('photo-1577680716097-9a565ddc2007', 1400),
    imageAlt: 'Glass of fresh orange juice with oranges',
    href: '/search?q=orange',
    ctaLabel: 'Shop Now',
  },
  {
    id: 'bnr_side_veg',
    placement: 'hero-side',
    title: '20% OFF',
    subtitle: 'Fresh vegetables, this week only',
    image: photo('photo-1609842947419-ba4f04d5d60f', 900),
    imageAlt: 'Basket of fresh vegetables',
    href: '/search?category=fruits-vegetables&onSale=true',
    ctaLabel: 'Shop Now',
  },
  {
    id: 'bnr_foodpouch',
    placement: 'brand',
    brand: 'Foodpouch',
    title: 'New Snacks Release',
    image: photo('photo-1691480213129-106b2c7d1ee8', 600),
    imageAlt: 'New Snacks Release',
    href: '/search?brand=Foodpouch',
  },
  {
    id: 'bnr_tea_joy',
    placement: 'brand',
    brand: 'Tea Joy',
    title: 'Happy Tea 100% Organic. From $29.9',
    image: photo('photo-1610478506025-8110cc8f1986', 600),
    imageAlt: 'Happy Tea 100% Organic. From $29.9',
    href: '/search?brand=Tea%20Joy',
  },
  {
    id: 'bnr_soda',
    placement: 'brand',
    brand: 'Soda Brand',
    title: 'Soda Can Box 24 Pieces - 30% OFF',
    image: photo('photo-1601774557352-8f2df2c6290c', 600),
    imageAlt: 'Soda Can Box 24 Pieces - 30% OFF',
    href: '/search?brand=Soda%20Brand',
  },
  {
    id: 'bnr_farmart_sausage',
    placement: 'brand',
    brand: 'Farmart',
    title: 'Fresh Meat Sausage. BUY 2 GET 1!',
    image: photo('photo-1691480241974-92481cef09ff', 600),
    imageAlt: 'Fresh Meat Sausage. BUY 2 GET 1!',
    href: '/search?brand=Farmart',
  },
]

export const heroBanner = banners.find((b) => b.placement === 'hero')!
export const promoBanner = banners.find((b) => b.placement === 'hero-side')!
export const brands = banners.filter((b) => b.placement === 'brand')

export const topSaver: Product[] = [
  {
    id: 'ts1',
    brand: 'Craft House',
    name: 'Craft Beer Can Variety Pack 330ml x 12',
    category: 'Wines & Alcohol Drinks',
    unit: '12 cans',
    price: 29.5,
    oldPrice: 34.0,
    rating: 4,
    reviews: 12,
    image: photo('photo-1626320290598-03656e931a31'),
    sold: 35,
    stock: 50,
  },
  {
    id: 'ts2',
    brand: 'Meat Brand',
    name: 'British Beef Mince (10% Fat)',
    category: 'Raw Meats',
    unit: '500g',
    price: 8.99,
    oldPrice: 10.0,
    rating: 5,
    reviews: 8,
    image: photo('photo-1609183556292-f208be1a9644'),
    sold: 25,
    stock: 50,
  },
  {
    id: 'ts3',
    brand: 'Farmart',
    name: 'Farmhouse Soft White Bread',
    category: 'Breads & Sweets',
    unit: '800g',
    price: 2.7,
    rating: 4,
    reviews: 21,
    image: photo('photo-1598373182308-3270495d2f58'),
    sold: 25,
    stock: 40,
  },
  {
    id: 'ts4',
    brand: 'Sunny Farm',
    name: 'Blood Oranges, Sweet & Juicy',
    category: 'Fruits & Vegetables',
    unit: '1kg',
    price: 4.15,
    oldPrice: 4.9,
    rating: 4,
    reviews: 5,
    image: photo('photo-1644751291719-574ef771ba30'),
    sold: 32,
    stock: 60,
  },
]

export const bestSellers: Product[] = [
  {
    id: 'bs1',
    brand: 'Sunny Farm',
    name: 'Organic Bananas',
    category: 'Fruits & Vegetables',
    unit: '1kg',
    price: 1.95,
    rating: 4,
    reviews: 9,
    image: photo('photo-1587334206596-c0f9f7dccbe6'),
  },
  {
    id: 'bs2',
    brand: 'Farmart',
    name: 'Beef Sirloin Steak',
    category: 'Raw Meats',
    unit: '400g',
    price: 14.99,
    rating: 4,
    reviews: 14,
    image: photo('photo-1625144093498-bf62fca631c5'),
  },
  {
    id: 'bs3',
    brand: 'ManPony',
    name: 'Sweet Yellow Melon',
    category: 'Fruits & Vegetables',
    unit: '1 piece',
    price: 3.9,
    oldPrice: 4.5,
    rating: 5,
    reviews: 6,
    image: photo('photo-1682250134340-0d74e04bec5f'),
  },
  {
    id: 'bs4',
    brand: 'Farmart',
    name: 'Sea Salt Potato Chips',
    category: 'Breads & Sweets',
    unit: '150g',
    price: 2.5,
    oldPrice: 2.95,
    rating: 4,
    reviews: 3,
    image: photo('photo-1694101493127-eca6dfef5011'),
  },
  {
    id: 'bs5',
    brand: 'Farmart',
    name: 'Homemade Oatmeal Cookies',
    category: 'Breads & Sweets',
    unit: '300g',
    price: 4.2,
    rating: 5,
    reviews: 18,
    image: photo('photo-1588345274200-42aa29063b78'),
  },
  {
    id: 'bs6',
    brand: 'Ocean Catch',
    name: 'Sardines in Olive Oil',
    category: 'Frozen Seafoods',
    unit: '125g',
    price: 2.99,
    oldPrice: 3.5,
    rating: 4,
    reviews: 7,
    image: photo('photo-1633442496335-af4d20202da3'),
  },
]

export const justLanding: Product[] = [
  {
    id: 'jl1',
    brand: 'Farmart Kitchen',
    name: 'Fresh Salmon Poke Bowl',
    category: 'Frozen Seafoods',
    unit: '350g',
    price: 9.5,
    oldPrice: 11.0,
    rating: 5,
    reviews: 4,
    image: photo('photo-1597958792579-bd3517df6399'),
  },
  {
    id: 'jl2',
    brand: 'Farmart Kitchen',
    name: 'Grilled Chicken Rice Box',
    category: 'Raw Meats',
    unit: '1 box',
    price: 6.99,
    rating: 4,
    reviews: 11,
    image: photo('photo-1616645258469-ec681c17f3ee'),
  },
  {
    id: 'jl3',
    brand: 'Wine House',
    name: 'Red Wine Cabernet 750ml',
    category: 'Wines & Alcohol Drinks',
    unit: '750ml',
    price: 18.0,
    rating: 5,
    reviews: 22,
    image: photo('photo-1610631787813-9eeb1a2386cc'),
  },
  {
    id: 'jl4',
    brand: 'Bee Garden',
    name: 'Raw Wildflower Honey',
    category: 'Breads & Sweets',
    unit: '500g',
    price: 7.2,
    oldPrice: 8.4,
    rating: 4,
    reviews: 9,
    image: photo('photo-1587049352851-8d4e89133924'),
  },
  {
    id: 'jl5',
    brand: 'Dairy Farm',
    name: 'Fresh Whole Milk 1L',
    category: 'Milks & Dairies',
    unit: '1L',
    price: 1.5,
    rating: 4,
    reviews: 30,
    image: photo('photo-1634141510639-d691d86f47be'),
  },
  {
    id: 'jl6',
    brand: 'Pet Joy',
    name: 'Bone Biscuits for Dogs',
    category: 'Pet Foods',
    unit: '1.2kg',
    price: 8.9,
    rating: 4,
    reviews: 6,
    image: photo('photo-1568640347023-a616a30bc3bd'),
  },
]

export function discountPercent(p: Product) {
  return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
}

/** product-card-featured: the biggest saving in a row, or none when nothing is discounted. */
export function featuredId(products: Product[]) {
  let best: Product | undefined
  for (const p of products)
    if (discountPercent(p) > (best ? discountPercent(best) : 0)) best = p
  return best?.id
}

/** Every product the store sells (ids are unique across sections). */
export const allProducts: Product[] = [
  ...topSaver,
  ...bestSellers,
  ...justLanding,
]

export function getProduct(id: string) {
  return allProducts.find((p) => p.id === id)
}

/** Same category first, then anything else, never the product itself. */
export function relatedProducts(p: Product, count = 6) {
  const others = allProducts.filter((o) => o.id !== p.id)
  return [
    ...others.filter((o) => o.category === p.category),
    ...others.filter((o) => o.category !== p.category),
  ].slice(0, count)
}
