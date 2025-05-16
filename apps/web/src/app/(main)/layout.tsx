import Footer from '@/components/shared/footer'
import Navbar from '@/components/shared/navbar'

export default function MainLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <main lang="en">
      <div className="flex w-full justify-center">
        <Navbar />
      </div>
      {children}
      <Footer />
    </main>
  )
}
