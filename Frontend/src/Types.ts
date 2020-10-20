export type Product = {
    /** product ID */
    asin: string
    thumbnail: string
    title: string
    amazonPrime: boolean
    amazonChoice: boolean
    price: {
        discounted: boolean
        savings_amount: number
        savings_percent: number
        current_price: number
        before_price: number
    }
    position: { global_position: number, position: number }
    reviews: { rating: number, total_reviews: number }
    url: string
}
export type ProductFull = Product & {
    main_image: string
    description: string
    item_available: boolean
    images: string[]
    badges: {
        amazon_prime: boolean
        'amazon_\u0441hoice': boolean
    }
}
export type ProductResult = {
    next_page: number
    totalProducts: string
    products: Product[]   
}
export type Category = {
    name: string
    category: string
}
export type Review = {
    id: string
    name: string
    rating: number
    review: string
    review_data: string
    title: string
    verified_purchase: boolean
}
export type ReviewResult = {
    next_page: number
    reviews: Review[]
}
export type CartItem = { quantity: number, product: Product }
export type Cart = { [k: string]: CartItem }
export type Wishlist = { [k: string]: Product }

export type Order = {
    asin: string
    status: 'orders'
    name: string
    price: string
    quantity: string
}

export type JWT = {
    exp: number
    email: string
}

export type User = {
    address: string
    name: string
}