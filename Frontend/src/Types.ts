export type Product = {
    /** product ID */
    asin: string
    thumbnail: string
    title: string
    price: Object
    position: { global_position: number, position: number }
    reviews: { rating: number, total_reviews: number }
    url: string
}
export type ProductResult = {
    next_page: number
    totalProducts: string
    products: Product[]   
}