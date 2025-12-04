import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Menu, Sparkles, Camera, ArrowLeft, Heart } from 'lucide-react';
import { MOCK_PRODUCTS, CATEGORIES } from './constants';
import { Product, CartItem, ViewState } from './types';
import { ProductCard } from './components/ProductCard';
import { AILibrarian } from './components/AILibrarian';
import { CartDrawer } from './components/CartDrawer';
import { searchProductsWithAI, searchByImage } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLibrarianOpen, setIsLibrarianOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Handlers
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeCartItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView(ViewState.PRODUCT_DETAIL);
    window.scrollTo(0, 0);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setView(ViewState.SEARCH_RESULTS);
    
    // Perform AI Search
    const productIds = await searchProductsWithAI(searchQuery);
    
    // Filter Mock Products based on AI Result
    const matchedProducts = MOCK_PRODUCTS.filter(p => productIds.includes(p.id));
    
    // Fallback: If AI fails or returns nothing, do a basic string match
    if (matchedProducts.length === 0) {
        const lowerQ = searchQuery.toLowerCase();
        const fallback = MOCK_PRODUCTS.filter(p => 
            p.title.toLowerCase().includes(lowerQ) || 
            p.description.toLowerCase().includes(lowerQ) ||
            p.category.toLowerCase().includes(lowerQ)
        );
        setProducts(fallback);
    } else {
        setProducts(matchedProducts);
    }
    
    setIsSearching(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSearching(true);
    setView(ViewState.SEARCH_RESULTS);
    setSearchQuery("Visual Search Results");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const productIds = await searchByImage(base64);
      const matchedProducts = MOCK_PRODUCTS.filter(p => productIds.includes(p.id));
      setProducts(matchedProducts.length > 0 ? matchedProducts : []);
      setIsSearching(false);
    };
    reader.readAsDataURL(file);
  };

  const resetHome = () => {
    setView(ViewState.HOME);
    setActiveCategory("All");
    setProducts(MOCK_PRODUCTS);
    setSearchQuery("");
  };

  const filteredProducts = view === ViewState.HOME && activeCategory !== "All"
    ? MOCK_PRODUCTS.filter(p => p.category === activeCategory)
    : products;

  return (
    <div className="min-h-screen bg-nypl-offwhite text-nypl-black flex flex-col font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-gray-600">
              <Menu size={24} />
            </button>
            <div 
                className="flex flex-col cursor-pointer" 
                onClick={resetHome}
            >
              <span className="font-serif text-2xl font-bold tracking-tight text-nypl-red leading-none">NYPL</span>
              <span className="text-xs font-semibold tracking-widest uppercase text-black">Shop</span>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search for books, gifts, souvenirs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full pl-10 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-nypl-red/20 focus:bg-white transition-all"
            />
            {/* Visual Search Trigger */}
            <label className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400 hover:text-nypl-red transition-colors" title="Search by Image">
              <Camera size={18} />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
                className="p-3 text-gray-600 hover:text-nypl-red hover:bg-red-50 rounded-full transition-colors hidden sm:block"
                onClick={() => setIsLibrarianOpen(true)}
            >
              <Sparkles size={20} />
            </button>
            <div className="relative">
              <button 
                className="p-3 text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 bg-nypl-red text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Nav */}
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
          <nav className="flex gap-8 border-b border-transparent">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setView(ViewState.HOME);
                  setProducts(MOCK_PRODUCTS);
                }}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeCategory === cat && view === ViewState.HOME
                    ? 'border-nypl-red text-nypl-red' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        
        {/* VIEW: Search Results */}
        {view === ViewState.SEARCH_RESULTS && (
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                    <button onClick={resetHome} className="flex items-center text-sm text-gray-500 hover:text-nypl-red">
                        <ArrowLeft size={16} className="mr-1" /> Back
                    </button>
                    <h1 className="text-2xl font-serif font-bold ml-4">
                        {isSearching ? 'Searching the archives...' : `Results for "${searchQuery}"`}
                    </h1>
                </div>
                {isSearching ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 animate-pulse">
                       {[...Array(4)].map((_, i) => (
                           <div key={i} className="aspect-[4/5] bg-gray-200 rounded-lg"></div>
                       ))}
                   </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg mb-4">We couldn't find anything matching your search in the stacks.</p>
                        <button onClick={() => setIsLibrarianOpen(true)} className="text-nypl-red font-medium hover:underline flex items-center justify-center gap-2">
                           <Sparkles size={16}/> Ask the Librarian for help
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {products.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onAddToCart={handleAddToCart}
                                onClick={handleProductClick}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* VIEW: Product Detail */}
        {view === ViewState.PRODUCT_DETAIL && selectedProduct && (
            <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
                <button onClick={() => setView(ViewState.HOME)} className="flex items-center text-sm text-gray-500 hover:text-nypl-red mb-8">
                    <ArrowLeft size={16} className="mr-1" /> Back to Browse
                </button>
                
                <div className="grid md:grid-cols-2 gap-12 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    {/* Image */}
                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
                        <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-center">
                        <div className="text-sm font-bold text-nypl-red uppercase tracking-wider mb-2">{selectedProduct.category}</div>
                        <h1 className="font-serif text-4xl md:text-5xl font-medium text-gray-900 mb-4">{selectedProduct.title}</h1>
                        <p className="text-2xl font-light text-gray-900 mb-6">${selectedProduct.price.toFixed(2)}</p>
                        
                        <p className="text-gray-600 leading-relaxed mb-8 text-lg font-light">
                            {selectedProduct.description}
                        </p>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleAddToCart(selectedProduct)}
                                className="flex-1 bg-nypl-red text-white py-4 px-8 rounded-full font-medium text-lg hover:bg-red-800 transition-shadow shadow-lg shadow-red-900/10 flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={20} /> Add to Cart
                            </button>
                            <button className="p-4 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors">
                                <Heart size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: Home Grid */}
        {view === ViewState.HOME && (
          <div className="space-y-12">
            {/* Hero Section (Only show on 'All') */}
            {activeCategory === "All" && (
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 text-white min-h-[400px] flex items-center">
                    <img 
                        src="https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=2000&q=80" 
                        alt="Library" 
                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                    <div className="relative z-10 p-12 max-w-2xl">
                        <span className="text-nypl-red font-bold tracking-widest uppercase mb-4 block">New Collection</span>
                        <h1 className="font-serif text-5xl md:text-6xl font-medium leading-tight mb-6">Gifts for the Literary Mind</h1>
                        <p className="text-lg text-gray-200 mb-8 font-light">Explore our curated selection of books, prints, and exclusive library-inspired gifts.</p>
                        <button 
                            onClick={() => setIsLibrarianOpen(true)}
                            className="bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                        >
                            <Sparkles size={18} className="text-nypl-red" /> Ask the Librarian for Ideas
                        </button>
                    </div>
                </div>
            )}

            <div>
                <h2 className="font-serif text-3xl font-medium mb-8 text-gray-900">
                    {activeCategory === "All" ? "Curated Picks" : activeCategory}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {filteredProducts.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onAddToCart={handleAddToCart}
                            onClick={handleProductClick}
                        />
                    ))}
                </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-nypl-black text-white pt-16 pb-8 mt-12">
          <div className="container mx-auto px-4 grid md:grid-cols-4 gap-12 mb-12">
              <div>
                  <h3 className="font-serif text-xl mb-6">NYPL Shop</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                      Proceeds from the Library Shop support the New York Public Library's programs, services, and collections.
                  </p>
              </div>
              <div>
                  <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-gray-500">Shop</h4>
                  <ul className="space-y-3 text-sm text-gray-300">
                      <li><a href="#" className="hover:text-white">Books</a></li>
                      <li><a href="#" className="hover:text-white">Gifts</a></li>
                      <li><a href="#" className="hover:text-white">Kids</a></li>
                      <li><a href="#" className="hover:text-white">Sale</a></li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-gray-500">Support</h4>
                  <ul className="space-y-3 text-sm text-gray-300">
                      <li><a href="#" className="hover:text-white">FAQ</a></li>
                      <li><a href="#" className="hover:text-white">Shipping & Returns</a></li>
                      <li><a href="#" className="hover:text-white">Contact Us</a></li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-bold text-sm uppercase tracking-widest mb-6 text-gray-500">Connect</h4>
                  <div className="flex gap-4">
                      {/* Social Icons Placeholder */}
                      <div className="w-8 h-8 bg-gray-800 rounded-full hover:bg-gray-700 cursor-pointer"></div>
                      <div className="w-8 h-8 bg-gray-800 rounded-full hover:bg-gray-700 cursor-pointer"></div>
                      <div className="w-8 h-8 bg-gray-800 rounded-full hover:bg-gray-700 cursor-pointer"></div>
                  </div>
              </div>
          </div>
          <div className="container mx-auto px-4 border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} The New York Public Library. All rights reserved.
          </div>
      </footer>

      {/* Drawers & Modals */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart}
        updateQuantity={updateCartQuantity}
        removeItem={removeCartItem}
      />

      <AILibrarian 
        isOpen={isLibrarianOpen} 
        onClose={() => setIsLibrarianOpen(false)} 
        onProductClick={(pid) => {
            const p = products.find(x => x.id === pid) || MOCK_PRODUCTS.find(x => x.id === pid);
            if(p) {
                handleProductClick(p);
                // On mobile, maybe close the chat? keeping it open for now as a guide.
            }
        }}
        products={MOCK_PRODUCTS}
      />

      {/* Floating Librarian Button (Mobile Only, since header has one for desktop) */}
      <button 
        onClick={() => setIsLibrarianOpen(true)}
        className="fixed bottom-6 right-6 md:hidden z-40 bg-nypl-red text-white p-4 rounded-full shadow-2xl hover:bg-red-800 transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkles size={24} />
      </button>

    </div>
  );
};

export default App;
