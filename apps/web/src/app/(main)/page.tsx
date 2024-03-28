
import ColabEasy from '@/components/colabEasy'
import Hero from '@/components/hero'
import LifeEasySection from '@/components/lifeEasySection'
import SecrectSection from '@/components/secretSection'
import { TextRevealCardPreview } from '@/components/textRevealCardPreview'

function Index(): React.JSX.Element {

  return (
    <>
      <Hero />
      <SecrectSection />
      <LifeEasySection />
      <TextRevealCardPreview />
      <ColabEasy />
    </>
  )
}

export default Index
