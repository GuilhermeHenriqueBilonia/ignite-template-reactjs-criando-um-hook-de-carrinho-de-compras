import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      
      const {data: product} = await api.get(`/products/${productId}`);

      if(!product){
        return
      }

      const {data: productStock} = await api.get(`/stock/${productId}`)

      const products = JSON.parse(localStorage.getItem('@RocketShoes:cart') || '[]');

      debugger;
      if(!products.find((x:Product) => x.id == productId)) {
        products.find((x:Product) => x.id == productId)
        product.amount = 1;
      } else {
        product.amount = products.find((x:Product) => x.id == productId).amount;
      }

      if(productStock.amount === product.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      if(!!products.find((x:Product) => x.id == productId)){
        products.find((x:Product) => x.id == productId).amount++;
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
      } else {
        if(products.length > 0){
          product.amount = 1
          products.push(product)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...products,product]))
        } else {
          product.amount = 1
          products.push(product)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([product]))
        }
      }
      setCart(products)
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    const products = JSON.parse(localStorage.getItem('@RocketShoes:cart') || '[]');
    try {
      debugger;
      const newProducts = products.filter((x:Product) => x.id !== productId);
      setCart(newProducts)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProducts))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    debugger
    const products = JSON.parse(localStorage.getItem('@RocketShoes:cart') || '[]');
    try {
      if(products.find((x:Product) => x.id === productId).amount <= 0){
        return
      }

      const stockProducts = await api.get('/stock')
      const productStock = stockProducts.data.find((x:Stock) => x.id === productId)
      

      const newAmount = products.find((x:Product) => x.id === productId).amount

      if(productStock.find((x:Stock) => x.id === productId) < newAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      products.find((x:Product) => x.id === productId).amount = newAmount;
      setCart(products)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
