import Image from "next/image"
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ['latin'] })

type KillersProps = {
    image: string
    twitterUserName: string
}
const Killers = ({ image, twitterUserName }: KillersProps) => {
    return (
        <div className="flex items-center justify-cente gap-2">
            <div className="flex justify-center items-center h-[48px] w-[48px] rounded-full border-[#3a3e41] border-solid border-[2px] bg-gradient-to-br from-[#181c20] to-[#282d31]">
                <Image
                    src={`./${image}.svg`}
                    height={36}
                    width={37}
                    alt={`${image}`}
                />
            </div>
            <div className={`flex flex-col justify-center items-center gap-1 ${inter.className}`}>
                <p className="text-white text-sm">{image}</p>
                <a href={`https://twitter.com/${twitterUserName}`} target="_blank">
                    <p className="text-[#727576] text-xs">@{twitterUserName}</p>
                </a>
            </div>
        </div>
    )
}

export default Killers