import ColabEasy from '@/components/colabEasy'
import Hero from '@/components/hero'
import LifeEasySection from '@/components/lifeEasySection'
import SecrectSection from '@/components/secretSection'
import Footer from '@/components/shared/footer'
import Navbar from '@/components/shared/navbar'

function Index(): React.JSX.Element {
  return (
    <main className="">
      <div className="flex w-full justify-center">
        <Navbar />
      </div>
      <Hero />
      <SecrectSection />
      <LifeEasySection />
      <ColabEasy />
      <Footer />
    </main>
  )
}

export default Index
