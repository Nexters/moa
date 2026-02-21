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
      <g clipPath="url(#clip-empty)">
        <path
          d="M40 80C62.0914 80 80 62.0914 80 40C80 17.9086 62.0914 0 40 0C17.9086 0 0 17.9086 0 40C0 62.0914 17.9086 80 40 80Z"
          fill="#343639"
        />
        <path
          d="M36.7648 38.9978H43.2499L48.8134 24.4199H56.2521L57.0234 38.9978H60.9018V43.4431H57.2588L57.9018 55.6166H51.8378L51.0599 43.4431H46.9947L42.156 55.6166H37.861L33.0422 43.4431H29.0367L28.3836 55.6166H22.1151L22.7582 43.4431H19.1162V38.9978H22.9936L23.7637 24.4199H31.2024L36.7648 38.9978ZM39.8355 47.0464H40.1792L41.5538 43.4442H38.461L39.8355 47.0464ZM48.7604 38.9978H50.7748L50.5317 35.1912H50.2731L48.7604 38.9978ZM29.2753 38.9978H31.282L29.7416 35.1072H29.4831L29.2742 38.9978H29.2753Z"
          fill="#63656A"
        />
      </g>
      <defs>
        <clipPath id="clip-empty">
          <rect width="80" height="80" fill="white" />
        </clipPath>
      </defs>
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
      <g clipPath="url(#clip-default)">
        <path
          d="M40 80C62.0914 80 80 62.0914 80 40C80 17.9086 62.0914 0 40 0C17.9086 0 0 17.9086 0 40C0 62.0914 17.9086 80 40 80Z"
          fill="#1FD683"
        />
        <path
          d="M36.7648 38.9978H43.2499L48.8134 24.4199H56.2521L57.0234 38.9978H60.9018V43.4431H57.2588L57.9018 55.6166H51.8378L51.0599 43.4431H46.9947L42.156 55.6166H37.861L33.0422 43.4431H29.0367L28.3836 55.6166H22.1151L22.7582 43.4431H19.1162V38.9978H22.9936L23.7637 24.4199H31.2024L36.7648 38.9978ZM39.8355 47.0464H40.1792L41.5538 43.4442H38.461L39.8355 47.0464ZM48.7604 38.9978H50.7748L50.5317 35.1912H50.2731L48.7604 38.9978ZM29.2753 38.9978H31.282L29.7416 35.1072H29.4831L29.2742 38.9978H29.2753Z"
          fill="#141414"
        />
      </g>
      <defs>
        <clipPath id="clip-default">
          <rect width="80" height="80" fill="white" />
        </clipPath>
      </defs>
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
      <g clipPath="url(#clip-vacation)">
        <path
          d="M40 80C62.0914 80 80 62.0914 80 40C80 17.9086 62.0914 0 40 0C17.9086 0 0 17.9086 0 40C0 62.0914 17.9086 80 40 80Z"
          fill="#348CFF"
        />
        <path
          d="M43.4558 45.8063C42.648 44.9991 42.6479 43.6898 43.4554 42.8824C44.2628 42.0752 45.5717 42.0753 46.3788 42.8828L56.6277 53.1346C57.4334 53.9407 57.4333 55.2473 56.6273 56.0531C55.8216 56.8587 54.5153 56.8589 53.7094 56.0534L43.4558 45.8063ZM49.8436 31.7466C50.3682 32.2206 51.1772 32.2239 51.6772 31.724L55.7149 27.6869C56.215 27.1869 56.2168 26.3722 55.6872 25.9035C47.5645 18.7154 35.1513 18.9883 27.378 26.7407C35.0331 24.2089 43.5231 26.0365 49.8436 31.7466ZM27.3166 26.802C19.5629 34.5741 19.29 46.9855 26.4796 55.1068C26.9483 55.6362 27.7628 55.6344 28.2628 55.1345L32.6023 50.7956C32.9357 50.4623 32.9345 49.9228 32.6125 49.5784C26.6746 43.228 24.7421 34.5835 27.3166 26.802ZM27.3575 26.7611L27.3371 26.7816C26.5969 32.6435 29.4375 40.1008 35.2404 46.344C35.7223 46.8625 36.5364 46.8622 37.0369 46.3618L46.9421 36.4582C47.4422 35.9582 47.4431 35.145 46.9257 34.663C40.6974 28.8612 33.2204 26.0211 27.3575 26.7611Z"
          fill="#141414"
        />
      </g>
      <defs>
        <clipPath id="clip-vacation">
          <rect width="80" height="80" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
