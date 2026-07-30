"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getProductById,
  products,
  type Product,
  type ProductVariant,
} from "@/lib";

const CART_STORAGE_KEY = "sneaker-vault-gh-demo-cart";
const MAX_LINE_QUANTITY = 10;

type StoredCartLine = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type StoreCartLine = StoredCartLine & {
  lineId: string;
  product: Product;
  variant: ProductVariant;
  lineTotal: number;
};

type StoreContextValue = {
  lines: StoreCartLine[];
  itemCount: number;
  subtotal: number;
  isHydrated: boolean;
  isCartOpen: boolean;
  addItem: (
    productId: string,
    variantId: string,
    quantity?: number,
  ) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function normalizeQuantity(quantity: number, inventoryQuantity: number) {
  return Math.min(
    Math.max(1, Math.trunc(quantity)),
    inventoryQuantity,
    MAX_LINE_QUANTITY,
  );
}

function sanitizeStoredLines(value: unknown): StoredCartLine[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((candidate) => {
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      !("productId" in candidate) ||
      !("variantId" in candidate) ||
      !("quantity" in candidate) ||
      typeof candidate.productId !== "string" ||
      typeof candidate.variantId !== "string" ||
      typeof candidate.quantity !== "number"
    ) {
      return [];
    }

    const product = products.find((item) => item.id === candidate.productId);
    const variant = product?.variants.find(
      (item) => item.id === candidate.variantId,
    );

    if (!product || !variant || !variant.availableForSale) {
      return [];
    }

    return [
      {
        productId: product.id,
        variantId: variant.id,
        quantity: normalizeQuantity(
          candidate.quantity,
          variant.inventoryQuantity,
        ),
      },
    ];
  });
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storedLines, setStoredLines] = useState<StoredCartLine[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) {
        return;
      }

      try {
        const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

        if (storedCart) {
          setStoredLines(sanitizeStoredLines(JSON.parse(storedCart)));
        }
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      } finally {
        setIsHydrated(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(storedLines),
    );
  }, [isHydrated, storedLines]);

  const addItem = useCallback(
    (productId: string, variantId: string, quantity = 1) => {
      const product = getProductById(productId);
      const variant = product?.variants.find((item) => item.id === variantId);

      if (!product || !variant?.availableForSale) {
        return;
      }

      setStoredLines((currentLines) => {
        const existingLine = currentLines.find(
          (line) => line.variantId === variantId,
        );

        if (existingLine) {
          return currentLines.map((line) =>
            line.variantId === variantId
              ? {
                  ...line,
                  quantity: normalizeQuantity(
                    line.quantity + quantity,
                    variant.inventoryQuantity,
                  ),
                }
              : line,
          );
        }

        return [
          ...currentLines,
          {
            productId,
            variantId,
            quantity: normalizeQuantity(quantity, variant.inventoryQuantity),
          },
        ];
      });
      setIsCartOpen(true);
    },
    [],
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        setStoredLines((currentLines) =>
          currentLines.filter((line) => line.variantId !== variantId),
        );
        return;
      }

      setStoredLines((currentLines) =>
        currentLines.map((line) => {
          if (line.variantId !== variantId) {
            return line;
          }

          const product = getProductById(line.productId);
          const variant = product?.variants.find(
            (item) => item.id === variantId,
          );

          if (!variant) {
            return line;
          }

          return {
            ...line,
            quantity: normalizeQuantity(
              quantity,
              variant.inventoryQuantity,
            ),
          };
        }),
      );
    },
    [],
  );

  const removeItem = useCallback((variantId: string) => {
    setStoredLines((currentLines) =>
      currentLines.filter((line) => line.variantId !== variantId),
    );
  }, []);

  const clearCart = useCallback(() => setStoredLines([]), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const lines = useMemo(
    () =>
      storedLines.flatMap((storedLine): StoreCartLine[] => {
        const product = getProductById(storedLine.productId);
        const variant = product?.variants.find(
          (item) => item.id === storedLine.variantId,
        );

        if (!product || !variant) {
          return [];
        }

        return [
          {
            ...storedLine,
            lineId: `${product.id}:${variant.id}`,
            product,
            variant,
            lineTotal: variant.price * storedLine.quantity,
          },
        ];
      }),
    [storedLines],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
      isHydrated,
      isCartOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    }),
    [
      addItem,
      clearCart,
      closeCart,
      isCartOpen,
      isHydrated,
      lines,
      openCart,
      removeItem,
      updateQuantity,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider.");
  }

  return context;
}
