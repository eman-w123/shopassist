export interface Product {
  id: number;
  name: string;
  price: number;
  sizes: string;
  stock: "In stock" | "Low stock";
}

export const products: Product[] = [
  { id: 1, name: "Classic White Tee", price: 1200, sizes: "S, M, L, XL", stock: "In stock" },
  { id: 2, name: "Slim Fit Jeans", price: 3500, sizes: "30, 32, 34", stock: "In stock" },
  { id: 3, name: "Summer Floral Dress", price: 2800, sizes: "S, M", stock: "Low stock" },
  { id: 4, name: "Leather Jacket", price: 8500, sizes: "M, L", stock: "In stock" },
  { id: 5, name: "Sports Sneakers", price: 4500, sizes: "7, 8, 9, 10", stock: "In stock" },
];

export const SYSTEM_PROMPT = `You are ShopAssist, a smart AI assistant for a clothing store called StyleZone.
You know these products:
1. Classic White Tee - Rs 1200 - Sizes S,M,L,XL - In stock
2. Slim Fit Jeans - Rs 3500 - Sizes 30,32,34 - In stock
3. Summer Floral Dress - Rs 2800 - Sizes S,M - Low stock
4. Leather Jacket - Rs 8500 - Sizes M,L - In stock
5. Sports Sneakers - Rs 4500 - Sizes 7,8,9,10 - In stock
Help customers find products, answer questions, and make buying decisions.
Be friendly, concise, and helpful. Respond in 2-3 sentences max.`;