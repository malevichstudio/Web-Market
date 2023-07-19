import create from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SkuEntity } from 'graphql/generated';

export type productDataProps = {
  productId: string;
  skuId: string;
  count: number;
  value: number;
  baseCurrency: string;
};

export type useCartStoreProps = {
  productData: productDataProps[];
  addToCart: (
    id: string,
    skuId: string,
    skus: SkuEntity[],
    baseCurrency: string,
  ) => void;
  clearCartLocalStorage: () => void;
  removeLocalCartItemById: (id: string) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
};

export const useCartStore = create<useCartStoreProps>()(
  immer(
    persist(
      (setState, getState) => ({
        productData: [],
        addToCart: (id, skuId, skus, baseCurrency) => {
          const products = getState().productData;
          if (
            products.some((prod) => prod.skuId === skuId) &&
            products.some((prod) => prod.productId === id)
          )
            return;
          const targetSku = skus.find((sku) => sku.id === skuId);

          setState((state) => ({
            productData: [
              ...state.productData,
              {
                productId: id,
                skuId: skuId,
                count: 1,
                value: targetSku?.value,
                baseCurrency: baseCurrency,
              },
            ],
          }));
        },
        clearCartLocalStorage: () => {
          // ! for clear locale Storage
          setState((state) => void (state.productData = []));
          useCartStore.persist.clearStorage();
        },
        removeLocalCartItemById: (id) => {
          const data = getState().productData;
          const newArrayProduct = data.filter((prod) => prod.skuId !== id);
          setState((state) => void (state.productData = newArrayProduct));
        },
        increase: (id) => {
          setState(
            (state) =>
              void ((
                state.productData.find(
                  (prod) => prod.skuId === id,
                ) as productDataProps
              ).count += 1),
          );
        },
        decrease: (id) => {
          setState(
            (state) =>
              void ((
                state.productData.find(
                  (prod) => prod.skuId === id,
                ) as productDataProps
              ).count -= 1),
          );
        },
      }),
      {
        name: 'cart',
      },
    ),
  ),
);
