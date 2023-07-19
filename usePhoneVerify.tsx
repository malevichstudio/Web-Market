import { getErrorName, MODAL_NAME } from 'utils';
import { ErrorMessage } from 'types/baseTypes';
import { useAlertContext, useAuthContext, useModalContext } from 'context';
import {
  useGetCurrentUserQuery,
  useSendPhoneConfirmationCodeMutation,
} from 'graphql/generated';
import { useTranslation } from 'next-i18next';

export const usePhoneVerify = () => {
  const { onOpenModal } = useModalContext();
  const { onOpenAlert } = useAlertContext();
  const { isAuth } = useAuthContext();
  const { t } = useTranslation();

  const { data: currentUserData } = useGetCurrentUserQuery({
    skip: !isAuth,
  });

  const phoneNumber = currentUserData?.getCurrentUser.phoneNumber;
  const [sendPhoneConfirmationCodeMutation] =
    useSendPhoneConfirmationCodeMutation();

  const phoneVerify = (ph?: string) => {
    if (!phoneNumber && !ph) return;
    if (currentUserData?.getCurrentUser.phoneIsVerified) {
      return onOpenAlert({
        subTitle: t`app.error.your_phone_is_authorized`,
      });
    }

    sendPhoneConfirmationCodeMutation({
      variables: {
        input: {
          phone: phoneNumber || ph || '',
        },
      },
      onCompleted: () => {
        onOpenAlert({ subTitle: t`app.code_has_been_sent` });
        onOpenModal(MODAL_NAME.phoneVerification, { phoneNumber });
      },
      onError: (error) => {
        onOpenAlert({
          subTitle: getErrorName(
            (error?.graphQLErrors[0]?.extensions?.exception as ErrorMessage)
              ?.name,
          ),
          error: true,
        });
      },
    });
  };
  return { phoneVerify };
};
