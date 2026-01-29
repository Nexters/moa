export function AppFooter({ children }: React.PropsWithChildren) {
  return (
    <div className="absolute inset-x-0 bottom-9 flex justify-center">
      {children}
    </div>
  );
}
