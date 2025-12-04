export interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
  description: string;
  rating: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  relatedProductIds?: string[];
  isThinking?: boolean;
}

export enum ViewState {
  HOME = 'HOME',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
  COLLECTION = 'COLLECTION',
}
