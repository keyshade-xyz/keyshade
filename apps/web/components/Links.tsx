import Image from "next/image"
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ['latin'] })
type LinksProps = {
    icon: string
    description: string
    link: string
}


const Links = ({ icon, description, link }: LinksProps) => {
    return (
        <a
            href={`${link}`}
            target="_blank"
        >
            <div
                className={`flex place-items-center gap-2 justify-center rounded-full border-[#3a3e41] border-solid border-[1px] bg-gradient-to-b from-[#0d1215]/45 to-[#323638]/45 px-4 py-2 ${inter.className} cursor-pointer transition-all ease-in-out duration-200 hover:scale-105`}
            >
                <Image
                    src={`./${icon}.svg`}
                    alt={`${icon}`}
                    height={12}
                    width={13}
                    className='unselectable'
                    draggable='false'
                />
                <p className="text-white text-xs md:text-md">{description}</p>
            </div>
        </a>
    )
}

export default Links