// ---- Users ----
export interface UserResponse {
  id: string
  email: string
  username: string
  is_email_verified: boolean
  full_name: string | null
  profile_photo_url: string | null
  bio: string | null
  location: string | null
  rating_avg: number
  rating_count: number
  created_at: string
}

export interface UpdateUserRequest {
  full_name?: string
  profile_photo_url?: string
  bio?: string
  location?: string
  username?: string
}

// ---- Auth ----
export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: "bearer"
}

export interface MessageResponse {
  message: string
}

// ---- Products ----
export type SellingType = "fixed_price" | "offers_only" | "fixed_price_offers"
export type ProductStatus = "active" | "reserved" | "sold" | "archived"

export interface ProductResponse {
  id: string
  owner_id: string
  title: string
  description: string | null
  category: string | null
  brand: string | null
  size: string | null
  color: string | null
  condition_rating: number
  price: number
  selling_type: SellingType
  status: ProductStatus
  created_at: string
  images?: ProductImage[]
}

export interface CreateProductRequest {
  title: string
  description?: string
  category?: string
  brand?: string
  size?: string
  color?: string
  condition_rating: number
  price: number
  selling_type?: SellingType
}

export type UpdateProductRequest = Partial<CreateProductRequest>

export interface ProductFilters {
  category?: string
  brand?: string
  size?: string
  condition_rating?: number
  price_min?: number
  price_max?: number
  q?: string
  sort?: "price_asc" | "price_desc" | "newest"
  owner_id?: string
}

// ---- Product Images ----
export interface ProductImage {
  id: string
  product_id: string
  url: string
  order_index: number
}

// ---- Favorites ----
export interface FavoriteItem {
  product: ProductResponse
  added_at: string
}

// ---- Bids ----
export type BidStatus = "pending" | "accepted" | "rejected"

export interface BidResponse {
  id: string
  product_id: string
  bidder_id: string
  amount: number
  status: BidStatus
  created_at: string
}

export interface CreateBidRequest {
  amount: number
}

// ---- Orders ----
export interface OrderResponse {
  id: string
  product_id: string
  buyer_id: string
  seller_id: string
  final_price: number
  status: "completed"
  created_at: string
}

// ---- Notifications ----
export type NotificationType =
  | "bid_created"
  | "bid_accepted"
  | "bid_rejected"
  | "order_paid"
  | "message_received"

export interface NotificationResponse {
  id: string
  type: NotificationType
  message: string
  product_id: string | null
  bid_id: string | null
  actor_id: string | null
  is_read: boolean
  created_at: string
}

export interface UnreadCountResponse {
  count: number
}

export interface OrderCounterparty {
  id: string
  username: string
  full_name: string | null
  profile_photo_url: string | null
}

export interface OrderDetailResponse {
  id: string
  final_price: number
  status: string
  created_at: string
  product: ProductResponse
  counterparty: OrderCounterparty
  has_review: boolean
}

// ---- Reviews ----
export interface ReviewCreateRequest {
  rating: number
  comment?: string
}

export interface ReviewResponse {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
}

// ---- Conversations / Chat ----
export interface ChatMessageResponse {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  bid_id: string | null
  is_read: boolean
  created_at: string
  bid: BidResponse | null
}

export interface ConversationParticipant {
  id: string
  username: string
  full_name: string | null
  profile_photo_url: string | null
}

export interface ConversationProduct {
  id: string
  title: string
  price: number
  status: ProductStatus
}

export interface ConversationResponse {
  id: string
  product: ConversationProduct
  counterparty: ConversationParticipant
  last_message: ChatMessageResponse | null
  unread_count: number
  is_seller: boolean
  created_at: string
}

export interface ConversationCreateRequest {
  product_id: string
}

export interface ChatMessageCreateRequest {
  content: string
}

// ---- Realtime (WebSocket) ----
export type RealtimeEvent =
  | { event: "notification"; notification: NotificationResponse }
  | { event: "message"; message: ChatMessageResponse }

// ---- Payments (Stripe) ----
export interface CheckoutSessionResponse {
  checkout_url: string
  session_id: string
}
