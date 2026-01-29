import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge<'custom-typography'>({
  extend: {
    classGroups: {
      // 커스텀 타이포그래피 클래스를 별도 그룹으로 분리
      'custom-typography': [
        { text: ['h1-700', 'h2-700', 'h3-700', 'h4-700', 'h5-700'] },
        { text: ['t1-700', 't1-600', 't1-500', 't1-400'] },
        { text: ['t2-700', 't2-600', 't2-500', 't2-400'] },
        { text: ['b1-700', 'b1-600', 'b1-500', 'b1-400'] },
        { text: ['b2-700', 'b2-600', 'b2-500', 'b2-400'] },
        { text: ['c1-600', 'c1-500', 'c1-400'] },
        { text: ['c2-600', 'c2-500', 'c2-400'] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
