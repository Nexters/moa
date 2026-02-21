import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';

import { RootLayout } from '~/features/app';
import { Home } from '~/features/home';
import { OnboardingLayout } from '~/features/onboarding';
import { CompletionScreen } from '~/features/onboarding/screens/completion-screen';
import { SalaryScreen } from '~/features/onboarding/screens/salary-screen';
import { ScheduleScreen } from '~/features/onboarding/screens/schedule-screen';
import { WelcomeScreen } from '~/features/onboarding/screens/welcome-screen';
import { EditSalaryScreen } from '~/features/settings/screens/edit-salary-screen';
import { EditScheduleScreen } from '~/features/settings/screens/edit-schedule-screen';
import { SalaryInfoScreen } from '~/features/settings/screens/salary-info-screen';
import { SettingsScreen } from '~/features/settings/screens/settings-screen';
import { commands, unwrapResult } from '~/lib/tauri-bindings';

// --- Root ---

const rootRoute = createRootRoute({
  component: RootLayout,
});

// --- Index (redirect based on onboarding state) ---

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    try {
      const isCompleted = unwrapResult(
        await commands.isOnboardingCompleted(),
      );
      throw redirect({ to: isCompleted ? '/home' : '/onboarding/welcome' });
    } catch (e) {
      if (e instanceof Error) {
        throw redirect({ to: '/onboarding/welcome' });
      }
      throw e;
    }
  },
});

// --- Home ---

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: Home,
});

// --- Onboarding ---

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingLayout,
});

const onboardingWelcomeRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: '/welcome',
  component: WelcomeScreen,
});

const onboardingSalaryRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: '/salary',
  component: SalaryScreen,
});

const onboardingScheduleRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: '/schedule',
  component: ScheduleScreen,
});

const onboardingCompletionRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: '/completion',
  component: CompletionScreen,
});

// --- Settings ---

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsScreen,
});

const settingsSalaryInfoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/salary-info',
  component: SalaryInfoScreen,
});

const settingsEditSalaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/edit-salary',
  component: EditSalaryScreen,
});

const settingsEditScheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/edit-schedule',
  component: EditScheduleScreen,
});

// --- Router ---

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  onboardingRoute.addChildren([
    onboardingWelcomeRoute,
    onboardingSalaryRoute,
    onboardingScheduleRoute,
    onboardingCompletionRoute,
  ]),
  settingsRoute,
  settingsSalaryInfoRoute,
  settingsEditSalaryRoute,
  settingsEditScheduleRoute,
]);

export const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ['/'] }),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
