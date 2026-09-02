export const DAILY_BASE = 100;
export const DAILY_STREAK_BONUS = 25;
export const DAILY_STREAK_CAP = 7;

export const WORK_MIN = 40;
export const WORK_MAX = 120;

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

export const SHOP: ShopItem[] = [
  { id: "cap", name: "Gang Cap", price: 250, description: "Look the part" },
  { id: "chain", name: "Gold Chain", price: 800, description: "Flex status" },
  { id: "bat", name: "Wooden Bat", price: 500, description: "For negotiations" },
  { id: "phone", name: "Burner Phone", price: 1200, description: "Stay untraceable" },
  { id: "suit", name: "Black Suit", price: 2000, description: "Boss energy" },
];

export function getShopItem(id: string) {
  return SHOP.find((i) => i.id === id.toLowerCase());
}

export function randomWorkPay() {
  return WORK_MIN + Math.floor(Math.random() * (WORK_MAX - WORK_MIN + 1));
}
