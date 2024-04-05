import Image from 'next/image'
import {
  AritraImg,
  AtanuImg,
  RajdipImg,
  SambitImg,
  SawanImg,
  SwatiImg
} from '@public/about/team'
import { ColorBGSVG } from '@public/hero'
import { TracingBeam } from '@/components/ui/tracing-beam'

const teamData = [
  {
    name: 'Sawan Bhattacharya',
    role: 'Founder & CEO',
    img: SawanImg,
    socials: {
      twitter: 'https://twitter.com/kriptonian8',
      linkedin: 'https://www.linkedin.com/in/sawan-bhattacharya/'
    }
  },
  {
    name: 'Rajdip Bhattacharya',
    role: 'Founder & CTO',
    img: RajdipImg,
    socials: {
      twitter: 'https://twitter.com/RajB47',
      linkedin: 'https://www.linkedin.com/in/rajdip-bhattacharya-581119232/'
    }
  },
  {
    name: 'Swatilakha Saha',
    role: 'CMO',
    img: SwatiImg,
    socials: {
      twitter: 'https://twitter.com/swatilakha',
      linkedin: 'https://www.linkedin.com/in/aritra-biswas-833a3522b/'
    }
  },
  {
    name: 'Aritra Biswas',
    role: 'CFO',
    img: AritraImg,
    socials: {
      linkedin: 'https://www.linkedin.com/in/rajdip-bhattacharya-581119232/'
    }
  },
  {
    name: 'Atanu Majumdar',
    role: 'UI/UX Designer',
    img: AtanuImg,
    socials: {
      twitter: 'https://twitter.com/kairen_me',
      linkedin: 'https://www.linkedin.com/in/atanu-majumdar-48010b154/'
    }
  },
  {
    name: 'SAMBIT CHAKRABORTY',
    role: 'AI Engineer',
    img: SambitImg,
    socials: {
      twitter: 'https://twitter.com/SambitChakrabo8',
      linkedin: 'https://www.linkedin.com/in/sambit-chakraborty-509343248/'
    }
  }
]

function About(): React.JSX.Element {
  return (
    <div className="relative flex  flex-col items-center justify-center ">
      <ColorBGSVG className="absolute -z-10 -translate-y-[6vw]" />
      <TracingBeam className="mt-[10vw] px-6 ">
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
            <div className="mt-10 grid grid-cols-2 gap-3 md:w-[60%] md:grid-cols-3">
              {teamData.map((members, index) => {
                return (
                  <div
                    className="border-brandBlue/40 flex h-[19rem] w-[10rem] flex-col rounded-lg border p-2"
                    // eslint-disable-next-line react/no-array-index-key -- we are using index as key because we are not expecting any changes in the data
                    key={index}
                  >
                    <Image
                      alt="Atanu"
                      className="aspect-square w-[10rem] rounded-md object-center"
                      placeholder="blur"
                      src={members.img}
                    />
                    <div className="flex h-full flex-col justify-between">
                      <div className=" flex flex-col gap-2">
                        <h3 className="text-lg text-white">{members.name}</h3>
                        <p className="text-white/60">{members.role}</p>
                      </div>
                      <div className=" flex gap-5">
                        {members.socials.twitter ? (
                          <a
                            href={members.socials.twitter}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <svg
                              fill="none"
                              height="14"
                              viewBox="0 0 14 14"
                              width="14"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.9726 2.66593C13.4484 2.89669 12.8932 3.04902 12.3247 3.11801C12.9232 2.75824 13.3714 2.19403 13.5864 1.52959C13.0317 1.85334 12.4168 2.08901 11.7623 2.22026C11.3305 1.75851 10.7583 1.45225 10.1346 1.34905C9.51091 1.24585 8.87057 1.35147 8.31305 1.64952C7.75552 1.94757 7.312 2.42136 7.05136 2.99733C6.79073 3.5733 6.72756 4.21921 6.87167 4.83476C4.48583 4.72217 2.37242 3.57592 0.956667 1.84459C0.699296 2.28198 0.565054 2.78086 0.568167 3.28834C0.568167 4.28584 1.07567 5.16259 1.8445 5.67767C1.38883 5.66317 0.943233 5.53997 0.544833 5.31834V5.35334C0.544575 6.01624 0.773657 6.65881 1.19321 7.17203C1.61277 7.68526 2.19696 8.03754 2.84667 8.16909C2.42567 8.2819 1.98474 8.29884 1.55633 8.21867C1.74074 8.78918 2.09864 9.28789 2.58009 9.64522C3.06155 10.0025 3.64254 10.2007 4.242 10.2119C3.22672 11.0087 1.97311 11.4412 0.6825 11.4398C0.455 11.4398 0.228083 11.4264 0 11.4008C1.31583 12.2433 2.8458 12.6905 4.40825 12.6893C9.68917 12.6893 12.5737 8.31667 12.5737 4.53142C12.5737 4.40892 12.5738 4.28642 12.565 4.16392C13.1285 3.75843 13.6146 3.25499 14 2.67759L13.9726 2.66593Z"
                                fill="#E2E8FF"
                                fillOpacity="0.55"
                              />
                            </svg>
                          </a>
                        ) : null}
                        {members.socials.linkedin ? (
                          <a
                            href={members.socials.linkedin}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <svg
                              fill="none"
                              height="14"
                              viewBox="0 0 14 14"
                              width="14"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g clipPath="url(#clip0_1503_19476)">
                                <path
                                  d="M11.9274 11.9303H9.85425V8.68175C9.85425 7.90708 9.8385 6.91017 8.77392 6.91017C7.693 6.91017 7.52792 7.75308 7.52792 8.62458V11.9303H5.45475V5.25H7.44625V6.16058H7.47308C7.75133 5.63558 8.428 5.08142 9.43892 5.08142C11.5395 5.08142 11.928 6.46392 11.928 8.2635L11.9274 11.9303ZM3.11325 4.33592C2.44592 4.33592 1.90983 3.79575 1.90983 3.13133C1.90983 2.4675 2.4465 1.92792 3.11325 1.92792C3.77825 1.92792 4.31725 2.4675 4.31725 3.13133C4.31725 3.79575 3.77767 4.33592 3.11325 4.33592ZM4.15275 11.9303H2.07375V5.25H4.15275V11.9303ZM12.9646 0H1.03308C0.462 0 0 0.4515 0 1.00858V12.9914C0 13.5491 0.462 14 1.03308 14H12.9628C13.5333 14 14 13.5491 14 12.9914V1.00858C14 0.4515 13.5333 0 12.9628 0H12.9646Z"
                                  fill="#E2E8FF"
                                  fillOpacity="0.55"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_1503_19476">
                                  <rect fill="white" height="14" width="14" />
                                </clipPath>
                              </defs>
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </TracingBeam>
    </div>
  )
}

export default About
