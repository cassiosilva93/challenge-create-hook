import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

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
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExistsInCart = updatedCart.find(
        (product) => product.id === productId
      );
      const { data } = await api.get(`/stock/${productId}`);
      const productAmount = data.amount;
      const currentAmount = productExistsInCart
        ? productExistsInCart.amount
        : 0;
      const updatedAmount = currentAmount + 1;

      console.log(productAmount);
      console.log(updatedAmount);

      if (updatedAmount > productAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExistsInCart) {
        productExistsInCart.amount = updatedAmount;
      } else {
        const { data } = await api.get(`/products/${productId}`);
        const newProduct = {
          ...data,
          amount: 1,
        };

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newArrayOfCart = [...cart];
      const productIndex = newArrayOfCart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex < 0) {
        throw new Error();
      }

      newArrayOfCart.splice(productIndex, 1);
      setCart(newArrayOfCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newArrayOfCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const { data } = await api.get(`/stock/${productId}`);
      const productAmount = data.amount;

      if (amount > productAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(
        (product) => product.id === productId
      );

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
