import Lottie, { type LottieComponentProps } from 'lottie-react';

import moaMoneyFillAnimation from '../assets/lottie/moa-money-fill.json';

type MoaMoneyLottieProps = Omit<LottieComponentProps, 'animationData'>;

export function MoaMoneyLottie(props: MoaMoneyLottieProps) {
  return <Lottie animationData={moaMoneyFillAnimation} {...props} />;
}
