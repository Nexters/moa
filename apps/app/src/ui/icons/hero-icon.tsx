import { cn } from 'tailwind-variants';

import coinRotateGif from '~/assets/coin-rotate.gif';

export type HeroIconVariant = 'empty' | 'working' | 'full' | 'holiday';

interface HeroIconProps {
  variant: HeroIconVariant;
  className?: string;
}

export function HeroIcon({ variant, className }: HeroIconProps) {
  switch (variant) {
    case 'working':
      return (
        <img src={coinRotateGif} alt="" className={cn('size-20', className)} />
      );
    case 'empty':
      return <EmptyIcon className={className} />;
    case 'full':
      return <DefaultIcon className={className} />;
    case 'holiday':
      return <VacationIcon className={className} />;
  }
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-20', className)}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M40 74C58.7777 74 74 58.7777 74 40C74 21.2223 58.7777 6 40 6C21.2223 6 6 21.2223 6 40C6 58.7777 21.2223 74 40 74Z"
        fill="#343639"
      />
      <path
        d="M37.2503 39.1482H42.7627L47.4917 26.757H53.8145L54.4701 39.1482H57.7668V42.9267H54.6702L55.2168 53.2741H50.0623L49.4011 42.9267H45.9457L41.8328 53.2741H38.1821L34.0861 42.9267H30.6814L30.1263 53.2741H24.7981L25.3447 42.9267H22.249V39.1482H25.5448L26.1994 26.757H32.5223L37.2503 39.1482ZM39.8605 45.9895H40.1526L41.321 42.9276H38.6921L39.8605 45.9895ZM47.4466 39.1482H49.1588L48.9522 35.9125H48.7324L47.4466 39.1482ZM30.8843 39.1482H32.5899L31.2806 35.8412H31.0608L30.8833 39.1482H30.8843Z"
        fill="#63656A"
      />
    </svg>
  );
}

function DefaultIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-20', className)}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M40 74C58.7777 74 74 58.7777 74 40C74 21.2223 58.7777 6 40 6C21.2223 6 6 21.2223 6 40C6 58.7777 21.2223 74 40 74Z"
        fill="#1FD683"
      />
      <path
        d="M37.2503 39.1482H42.7627L47.4917 26.757H53.8145L54.4701 39.1482H57.7668V42.9267H54.6702L55.2168 53.2741H50.0623L49.4011 42.9267H45.9457L41.8328 53.2741H38.1821L34.0861 42.9267H30.6814L30.1263 53.2741H24.7981L25.3447 42.9267H22.249V39.1482H25.5448L26.1994 26.757H32.5223L37.2503 39.1482ZM39.8605 45.9895H40.1526L41.321 42.9276H38.6921L39.8605 45.9895ZM47.4466 39.1482H49.1588L48.9522 35.9125H48.7324L47.4466 39.1482ZM30.8843 39.1482H32.5899L31.2806 35.8412H31.0608L30.8833 39.1482H30.8843Z"
        fill="#141414"
      />
    </svg>
  );
}

function VacationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-20', className)}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M40 74C58.7777 74 74 58.7777 74 40C74 21.2223 58.7777 6 40 6C21.2223 6 6 21.2223 6 40C6 58.7777 21.2223 74 40 74Z"
        fill="#348CFF"
      />
      <path
        d="M42.9375 44.9354C42.2509 44.2493 42.2508 43.1364 42.9372 42.4501C43.6235 41.764 44.736 41.7641 45.4221 42.4504L54.1336 51.1645C54.8185 51.8496 54.8184 52.9602 54.1333 53.6452C53.4484 54.33 52.3381 54.3301 51.6531 53.6455L42.9375 44.9354ZM48.3672 32.9847C48.8131 33.3875 49.5007 33.3904 49.9257 32.9654L53.3578 29.534C53.7828 29.109 53.7844 28.4164 53.3342 28.0181C46.4299 21.9081 35.8787 22.1401 29.2714 28.7296C35.7782 26.5776 42.9948 28.1311 48.3672 32.9847ZM29.2192 28.7818C22.6286 35.3881 22.3966 45.9377 28.5078 52.8409C28.9061 53.2908 29.5985 53.2893 30.0235 52.8644L33.7121 49.1764C33.9955 48.893 33.9944 48.4344 33.7208 48.1417C28.6735 42.7438 27.0309 35.3961 29.2192 28.7818ZM29.254 28.747L29.2366 28.7644C28.6075 33.7471 31.022 40.0858 35.9545 45.3925C36.3641 45.8332 37.0561 45.8329 37.4815 45.4076L45.9009 36.9895C46.326 36.5645 46.3268 35.8733 45.887 35.4636C40.5929 30.532 34.2375 28.118 29.254 28.747Z"
        fill="#141414"
      />
    </svg>
  );
}
