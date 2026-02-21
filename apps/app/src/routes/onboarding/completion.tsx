import { createFileRoute } from '@tanstack/react-router';

import { CompletionScreen } from '~/features/onboarding/screens/completion-screen';

export const Route = createFileRoute('/onboarding/completion')({
  component: CompletionScreen,
});
