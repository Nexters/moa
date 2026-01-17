import { create } from 'zustand';

// 랜덤 생성용 데이터
const ADJECTIVES = [
  '성실한',
  '부지런한',
  '열정적인',
  '꼼꼼한',
  '유능한',
  '프로',
];

const CHARACTERS = ['뚱이', '징징이', '다람이', '핑핑이', '보노보노', '포차코'];

const COMPANIES = [
  '집게리아',
  '버거왕국',
  '초코파이공장',
  '별다방',
  '감자튀김연구소',
  '햄버거학교',
  '피자왕국',
  '치킨나라',
];

function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  return `${adj} ${char}`;
}

function generateRandomCompany(): string {
  return COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
}

interface OnboardingData {
  nickname: string;
  companyName: string;
  monthlyNetSalary: number;
}

interface OnboardingState {
  currentStep: number;
  data: OnboardingData;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  regenerateNickname: () => void;
  regenerateCompany: () => void;
  reset: () => void;
}

const createInitialData = (): OnboardingData => ({
  nickname: generateRandomNickname(),
  companyName: generateRandomCompany(),
  monthlyNetSalary: 0,
});

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  data: createInitialData(),

  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 3) })),

  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  updateData: (partial) => set((s) => ({ data: { ...s.data, ...partial } })),

  regenerateNickname: () =>
    set((s) => ({ data: { ...s.data, nickname: generateRandomNickname() } })),

  regenerateCompany: () =>
    set((s) => ({ data: { ...s.data, companyName: generateRandomCompany() } })),

  reset: () => set({ currentStep: 1, data: createInitialData() }),
}));
