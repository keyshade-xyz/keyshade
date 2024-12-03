import { ColorBGSVG } from '@public/hero'
import { TracingBeam } from '@/components/ui/tracing-beam'

function About(): React.JSX.Element {
  return (
    <div className="relative flex  flex-col items-center justify-center ">
      <ColorBGSVG className="absolute -z-10 -translate-y-[6vw]" />
      <TracingBeam className="mt-[10vw] px-6">
        <div className="flex flex-col gap-6">
          <article className="flex flex-col gap-y-10 px-2 md:w-[60vw]">
            <div className="flex flex-col gap-5">
              <h2 className="text-brandBlue/80 text-5xl">The Problem</h2>
              <p className="text-white/60">
                We believe Configuration Mangement is an easily overlooked part
                of software developement, all teams need it and all teams do it,
                but not in a proper systematic way, sometimes secrets are shared
                over slack ,sometimes over direct messages and often over email.
                This may be an easier solution in the beginning but as the size
                of your app grows , so does the amount of secrets you have to
                hide. That is when you start facing problems.
              </p>
            </div>
            <div className="flex flex-col gap-5">
              <h2 className="text-brandBlue/80 text-5xl">
                What we’re building
              </h2>
              <p className="text-white/60">
                How about a tool that can help you manage all your
                configurations with best in class security, and also streamline
                changes made to them to propagate to all applications that use
                them? How about a tool that helps you collaborate on
                configuration management like never before? This is where
                keyshade comes in
                <br />
                <br />
                keyshade is an open source configuration management platform
                that allows you to manage your secrets and variables in most
                logical way possible. It is a tool made with developer&apos;s
                ease at the top of mind, so, expect to never get blocked out by
                overwhelming complexity or steep learning curve.
                <br />
                <br />
                Our ecosystem of plugins allow you to integrate keyshade with
                any cloud provider on the planet! Are you consuming an API key
                in your GitHub Action workflow? No need to manage the `secrets`
                section. Rather let keyshade do the integration for you! Any
                time that you change a config in your dashboard, any and every
                application that uses that will also get updated accordingly -
                enabling you to not worry about restarting your application.
              </p>
            </div>
            <div className="flex flex-col gap-5">
              <h2 className="text-brandBlue/80 text-5xl">Our Mission</h2>
              <p className="text-white/60">
                At Keyshade, our mission is to revolutionize the way developers
                manage configurations, secrets, and variables in their
                applications. We strive to provide a comprehensive solution that
                not only ensures top-notch security but also simplifies the
                entire process, allowing teams to collaborate seamlessly and
                focus on what truly matters: building great software. Our goal
                is to empower developers with the tools they need to efficiently
                manage configurations across any scale, enabling them to stay
                agile and responsive in today&apos;s fast-paced development
                environment.
              </p>
            </div>
          </article>
          <section>
            <div className="flex flex-col gap-5">
              <h2 className="text-brandBlue/80 text-5xl">Team</h2>
              <p className="text-white/60">
                We are a team of passionate individuals who are dedicated to
                creating innovative solutions that empower developers and teams
                to build better software. Our team is made up of talented field
                experts who bring a wealth of experience and knowledge to the
                table. We are committed to delivering a product that exceeds
                expectations and provides real value to our users. Our goal is
                to make configuration management simple, secure, and efficient,
                so that developers can focus on what they do best: creating
                amazing software.
              </p>
            </div>
          </section>
        </div>
      </TracingBeam>
    </div>
  )
}

export default About
