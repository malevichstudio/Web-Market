import { timeZoneCityToCountry } from 'utils';

type locationType = 'userRegion' | 'userCity' | 'userCountry' | 'userTimeZone';

export const getMyLocationInfo = () => {
  let userRegion = '';
  let userCity = '';
  let userCountry = '';
  let userTimeZone = '';

  if (Intl) {
    userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzArr = userTimeZone.split('/');
    userRegion = tzArr[0];
    userCity = tzArr[tzArr.length - 1];
    userCountry = timeZoneCityToCountry[userCity];
  }

  return {
    userRegion,
    userCity,
    userCountry,
    userTimeZone,
  } as Record<locationType, string>;
};
