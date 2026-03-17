export interface User {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin' | 'salesman' | 'deliveryman';
    avatar: string;
    phone?: string;
    addresses: Address[];
    wishlist: string[] | Product[];
    isActive: boolean;
    createdAt: string;
}

export interface Address {
    id?: string;
    label: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    price: number;
    comparePrice?: number;
    category: Category | string;
    subcategory?: Category | string;
    variants: Variant[];
    images: string[];
    thumbnail?: string;
    tags: string[];
    metaTitle?: string;
    metaDescription?: string;
    seller: { id: string; name: string; avatar?: string } | string;
    brand?: string;
    totalSold: number;
    avgRating: number;
    numReviews: number;
    totalStock: number;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: string;
}

export interface Variant {
    id?: string;
    size?: string;
    color?: string;
    sku: string;
    stock: number;
    price?: number;
    images?: string[];
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    icon?: string;
    parent?: Category | string | null;
    subcategories?: Category[];
    isActive: boolean;
}

export interface CartItem {
    id?: string;
    product: Product;
    variant?: { size?: string; color?: string; sku?: string };
    quantity: number;
}

export interface Cart {
    id?: string;
    items: CartItem[];
    couponCode?: string;
    couponDiscount: number;
}

export interface OrderItem {
    product: string | Product;
    name: string;
    image: string;
    variant?: { size?: string; color?: string; sku?: string };
    quantity: number;
    price: number;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';

export interface Order {
    id: string;
    user: User | string;
    orderNumber: string;
    items: OrderItem[];
    shippingAddress: Address;
    paymentMethod: 'stripe' | 'paypal' | 'cod';
    paymentResult?: { id: string; status: string };
    itemsPrice: number;
    shippingPrice: number;
    taxPrice: number;
    discountAmount: number;
    totalPrice: number;
    couponCode?: string;
    status: OrderStatus;
    statusHistory: { status: string; timestamp: string; note?: string }[];
    deliveryman?: User | string;
    deliveredAt?: string;
    paidAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    invoice?: string;
    estimatedDelivery?: string;
    delivery?: any[];
    createdAt: string;
}

export interface Review {
    id: string;
    user: { id: string; name: string; avatar?: string };
    product: string | Product;
    rating: number;
    title?: string;
    comment: string;
    images: string[];
    isVerifiedPurchase: boolean;
    helpfulVotes: number;
    notHelpfulVotes: number;
    isApproved: boolean;
    createdAt: string;
}

export interface Ad {
    id: string;
    title: string;
    type: 'banner' | 'video' | 'featured';
    media: string;
    link?: string;
    placement: 'homepage' | 'category' | 'product';
    product?: Product;
    isActive: boolean;
}

export interface Delivery {
    id: string;
    order: Order;
    deliveryman: User;
    status: 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
    currentLocation: { lat: number; lng: number; updatedAt: string };
    deliveryLocation: { lat: number; lng: number; address: string };
    estimatedDeliveryTime?: string;
    proofImage?: string;
    createdAt: string;
}

export interface Notification {
    id: string;
    type: 'order' | 'payment' | 'delivery' | 'system' | 'promotion';
    title: string;
    message: string;
    isRead: boolean;
    data?: Record<string, unknown>;
    createdAt: string;
}

export interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount: number;
    maxDiscount?: number;
    usageLimit?: number;
    usedCount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface DashboardStats {
    totalRevenue: number;
    todaySales: number;
    todayOrders: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: Order[];
}
