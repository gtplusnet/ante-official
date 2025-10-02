export default function UnauthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      {children}
    </main>
  )
}