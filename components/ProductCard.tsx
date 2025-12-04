import React from 'react';
import { Product } from '../types';
import { ShoppingBag, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick }) => {
  return (
    <div className="group relative bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div 
        className="aspect-square w-full overflow-hidden bg-gray-100 relative cursor-pointer"
        onClick={() => onClick(product)}
      >
        <img 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        
        {/* Quick Add Button (Mobile/Desktop Hover) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="absolute bottom-4 right-4 bg-nypl-red text-white p-3 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-800"
          aria-label="Add to cart"
        >
          <ShoppingBag size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.category}</div>
        <h3 
          className="font-serif text-lg text-gray-900 font-medium leading-tight mb-2 cursor-pointer hover:text-nypl-red transition-colors"
          onClick={() => onClick(product)}
        >
          {product.title}
        </h3>
        
        {/* Rating Mockup */}
        <div className="flex items-center mb-3">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={14} 
              className={i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
            />
          ))}
          <span className="text-xs text-gray-400 ml-2">({Math.floor(Math.random() * 50) + 10})</span>
        </div>

        <div className="mt-auto flex justify-between items-center">
          <span className="font-semibold text-gray-900">${product.price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
