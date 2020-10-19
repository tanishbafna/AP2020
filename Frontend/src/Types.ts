export type Product = {
    /** product ID */
    asin: string
    thumbnail: string
    title: string
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
    images: string[]
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
export type Cart = { [k: string]: { quantity: number, product: Product } }