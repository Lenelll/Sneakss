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

export type CommerceMode = "demo" | "shopify";

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

type CartSnapshot = {
  lines: StoreCartLine[];
  itemCount: number;
  subtotal: number;
};

type CartApiResponse = CartSnapshot & {
  mode: CommerceMode;
  error?: string;
};

type StoreContextValue = CartSnapshot & {
  mode: CommerceMode;
  isHydrated: boolean;
  isCartOpen: boolean;
  isPending: boolean;
  cartError: string;
  addItem: (
    product: Product,
    variant: ProductVariant,
    quantity?: number,
  ) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<boolean>;
  removeItem: (variantId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  openCart: () => void;
  closeCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function normalizeQuantity(quantity: number, inventoryQuantity: number) {
  return Math.min(
    Math.max(1, Math.trunc(quantity)),
    Math.max(1, inventoryQuantity),
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

function demoSnapshot(storedLines: StoredCartLine[]): CartSnapshot {
  const lines = storedLines.flatMap((storedLine): StoreCartLine[] => {
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
  });

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
  };
}

async function requestCart(
  body?: Record<string, unknown>,
): Promise<CartApiResponse> {
  const response = await fetch("/api/cart", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | CartApiResponse
    | null;

  if (!response.ok || !payload) {
    throw new Error(
      payload?.error ?? "Your bag could not be updated. Please try again.",
    );
  }

  return payload;
}

export function StoreProvider({
  children,
  initialMode = "demo",
}: {
  children: ReactNode;
  initialMode?: CommerceMode;
}) {
  const [mode, setMode] = useState<CommerceMode>(initialMode);
  const [storedLines, setStoredLines] = useState<StoredCartLine[]>([]);
  const [liveCart, setLiveCart] = useState<CartSnapshot>({
    lines: [],
    itemCount: 0,
    subtotal: 0,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function hydrate() {
      if (initialMode === "shopify") {
        try {
          const payload = await requestCart();

          if (!isActive) {
            return;
          }

          setMode(payload.mode);
          setLiveCart(payload);
          setCartError(payload.error ?? "");
        } catch (error) {
          if (!isActive) {
            return;
          }

          setCartError(
            error instanceof Error
              ? error.message
              : "Your bag could not be loaded.",
          );
        } finally {
          if (isActive) {
            setIsHydrated(true);
          }
        }

        return;
      }

      try {
        const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

        if (storedCart && isActive) {
          setStoredLines(sanitizeStoredLines(JSON.parse(storedCart)));
        }
      } catch {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      } finally {
        if (isActive) {
          setIsHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      isActive = false;
    };
  }, [initialMode]);

  useEffect(() => {
    if (!isHydrated || mode !== "demo") {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedLines));
  }, [isHydrated, mode, storedLines]);

  const runLiveMutation = useCallback(
    async (body: Record<string, unknown>) => {
      setIsPending(true);
      setCartError("");

      try {
        const payload = await requestCart(body);
        setMode(payload.mode);
        setLiveCart(payload);
        setCartError(payload.error ?? "");
        return true;
      } catch (error) {
        setCartError(
          error instanceof Error
            ? error.message
            : "Your bag could not be updated.",
        );
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const addItem = useCallback(
    async (
      product: Product,
      variant: ProductVariant,
      quantity = 1,
    ) => {
      if (!variant.availableForSale) {
        return false;
      }

      if (!product.isDemo && mode === "shopify") {
        const added = await runLiveMutation({
          action: "add",
          variantId: variant.id,
          quantity,
        });

        if (added) {
          setIsCartOpen(true);
        }

        return added;
      }

      if (!product.isDemo) {
        setCartError(
          "Shopify is temporarily unavailable. Live products cannot be added to a demo bag.",
        );
        return false;
      }

      setMode("demo");
      setStoredLines((currentLines) => {
        const existingLine = currentLines.find(
          (line) => line.variantId === variant.id,
        );

        if (existingLine) {
          return currentLines.map((line) =>
            line.variantId === variant.id
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
            productId: product.id,
            variantId: variant.id,
            quantity: normalizeQuantity(quantity, variant.inventoryQuantity),
          },
        ];
      });
      setCartError("");
      setIsCartOpen(true);
      return true;
    },
    [mode, runLiveMutation],
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (mode === "shopify") {
        const line = liveCart.lines.find(
          (candidate) => candidate.variantId === variantId,
        );

        if (!line) {
          return false;
        }

        return runLiveMutation({
          action: quantity <= 0 ? "remove" : "update",
          lineId: line.lineId,
          quantity,
        });
      }

      if (quantity <= 0) {
        setStoredLines((currentLines) =>
          currentLines.filter((line) => line.variantId !== variantId),
        );
        return true;
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
      return true;
    },
    [liveCart.lines, mode, runLiveMutation],
  );

  const removeItem = useCallback(
    async (variantId: string) => updateQuantity(variantId, 0),
    [updateQuantity],
  );

  const clearCart = useCallback(async () => {
    if (mode === "shopify") {
      return runLiveMutation({ action: "clear" });
    }

    setStoredLines([]);
    return true;
  }, [mode, runLiveMutation]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const snapshot = useMemo(
    () => (mode === "shopify" ? liveCart : demoSnapshot(storedLines)),
    [liveCart, mode, storedLines],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      ...snapshot,
      mode,
      isHydrated,
      isCartOpen,
      isPending,
      cartError,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    }),
    [
      addItem,
      cartError,
      clearCart,
      closeCart,
      isCartOpen,
      isHydrated,
      isPending,
      mode,
      openCart,
      removeItem,
      snapshot,
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
