import Footer from '@/components/shared/footer'
import Navbar from '@/components/shared/navbar'
// import TopBanner from '@/components/topBanner'

export default function MainLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <main lang="en">
      {/* <TopBanner /> */}
      <div className="flex w-full justify-center">
        <Navbar />
      </div>
      {children}
      <Footer />
    </main>
  )
}
