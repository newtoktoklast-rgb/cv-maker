export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="auth-background">
        <div className="auth-grid-overlay" />
      </div>
      <div className="auth-container">{children}</div>
    </>
  );
}
