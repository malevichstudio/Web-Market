import {
  AUTH_PATHS,
  getClientTime,
  getDataCartToCreateFiatOrder,
  getErrorName,
  getIdCurrency,
  MODAL_NAME,
  PATHS,
} from 'utils';
import {
  CreateOrderErrorSchema,
  CurrencyEnum,
  GetAllCurrencyQuery,
  useCreateFiatOrderMutation,
  usePayOrderLazyQuery,
  UserLanguagesEnum,
} from 'graphql/generated';
import { useRouter } from 'next/router';
import { useAlertContext, useAuthContext, useModalContext } from 'context';
import { useLaptop } from 'hooks/useLaptop';
import { useCurrentLanguage } from 'hooks/useCurrentLanguage';
import { CurrencyType } from 'types/baseTypes';
import { useIsDisabledProductRowStore } from 'Store';
import { ApolloQueryResult } from '@apollo/client/core/types';
import { useState } from 'react';

interface UseCheckoutForDefaultCartProps {
  fiatAllCurrency: ApolloQueryResult<GetAllCurrencyQuery>;
  currentCurrency: CurrencyType;
  productData: any;
}

export const useCheckoutForDefaultCart = ({
  fiatAllCurrency,
  currentCurrency,
  productData,
}: UseCheckoutForDefaultCartProps) => {
  const router = useRouter();
  const { onOpenModal } = useModalContext();
  const { onOpenAlert } = useAlertContext();
  const { isAuth } = useAuthContext();
  const { isOverLaptop } = useLaptop();
  const { isENLang } = useCurrentLanguage();

  const [errorPreOrder, setErrorPreOrder] = useState<
    CreateOrderErrorSchema | undefined
  >();

  const [dataIds, setDataIds] = useIsDisabledProductRowStore((state) => [
    state.dataIds,
    state.setDataIds,
  ]);

  const [createFiatOrder, { loading: createFiatOrderLoading }] =
    useCreateFiatOrderMutation();
  const [payOrderLQ, { loading: payOrderLQLoading }] = usePayOrderLazyQuery();

  const currencyId = getIdCurrency(
    fiatAllCurrency.data.getAllCurrency,
    currentCurrency as CurrencyType,
  );

  const doCheckout = async () => {
    if (!isAuth) {
      if (isOverLaptop) {
        return onOpenModal(MODAL_NAME.signIn);
      } else {
        return router.push(
          {
            pathname: AUTH_PATHS.signIn,
            query: { from: PATHS.cart },
          },
          AUTH_PATHS.signIn,
        );
      }
    }
    if (createFiatOrderLoading || payOrderLQLoading) return;

    await createFiatOrder({
      variables: {
        input: {
          carts: getDataCartToCreateFiatOrder(productData),
          clientTime: getClientTime(),
          currencyId: currencyId,
          currencyIso: currentCurrency as CurrencyEnum,
          languageIso: isENLang ? UserLanguagesEnum.En : UserLanguagesEnum.Ar,
        },
      },
      onError: (error) => {
        onOpenAlert({ error: true, subTitle: getErrorName(error.message) });
      },
      onCompleted: (data) => {
        const orderId = data.createFiatOrder.order
          ? +data.createFiatOrder.order.id
          : 0;
        const errorTarget = data.createFiatOrder.data.find((i) => i.error);

        if (errorTarget?.error) {
          setDataIds(String(errorTarget?.skuId));
        }

        if (errorTarget?.error) return;
        if (data.createFiatOrder.error) {
          return setErrorPreOrder(
            data.createFiatOrder as CreateOrderErrorSchema,
          );
        }

        payOrderLQ({
          variables: {
            input: {
              id: orderId,
              languageIso: isENLang
                ? UserLanguagesEnum.En
                : UserLanguagesEnum.Ar,
            },
          },
          onCompleted: (data) => {
            if (typeof window !== 'undefined') {
              window.location.href = data.payOrder;
            }
          },
          onError: (error) => {
            onOpenAlert({ error: true, subTitle: getErrorName(error.message) });
          },
        });
      },
    });
  };
  return {
    doCheckout,
    createFiatOrderLoading,
    payOrderLQLoading,
    dataIds,
    errorPreOrder,
  };
};
