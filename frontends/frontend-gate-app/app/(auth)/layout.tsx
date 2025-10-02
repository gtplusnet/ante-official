import { Header } from '@/components/layout/Header'
import { DatabaseProvider } from '@/components/providers/DatabaseProvider'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DatabaseProvider>
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        {children}
      </main>
    </DatabaseProvider>
  )
}