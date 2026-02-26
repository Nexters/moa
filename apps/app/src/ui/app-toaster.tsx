import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          width: 'fit-content',
          margin: '0 auto',
          display: 'inline-flex',
          padding: '12px 20px',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '12px',
          background: '#343639',
          color: '#ffffff',
          border: 'none',
          boxShadow: 'none',
          fontSize: '14px',
          lineHeight: '21px',
          letterSpacing: '-0.2px',
          fontWeight: 500,
        },
      }}
    />
  );
}
