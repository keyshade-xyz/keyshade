"use client"

import { useState } from "react"
import { Copy, Eye, EyeOff, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { copyToClipboard } from "@/lib/clipboard"

interface HiddenContentProps {
    isPrivateKey: boolean
    value: string
}

export function HiddenContent({ isPrivateKey, value }: HiddenContentProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [copied, setCopied] = useState(false)

    const toggleVisibility = () => {
        setIsVisible(!isVisible)
    }

    const handleCopyToClipboard = () => {
        copyToClipboard(value, `You copied the ${isPrivateKey ? 'private' : 'public'} key successfully.`, `Failed to copy the ${isPrivateKey ? 'private' : 'public'} key.`, `You successfully copied the ${isPrivateKey ? 'private' : 'public'} key.`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const maskedValue = value.replace(/./g, "•")

    return (
        <div className="relative flex items-center">
            <Input
            className={isPrivateKey ? 'pr-20' : 'pr-12'}
            readOnly
            type="text"
            value={isPrivateKey && isVisible ? maskedValue : value}
            />
            <div className="absolute right-1 flex items-center gap-1">
                <Button
                aria-label={copied ? "Copied" : "Copy to clipboard"}
                className="h-8 w-8"
                onClick={handleCopyToClipboard}
                size="icon"
                type="button"
                variant="ghost"
                >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                {
                    isPrivateKey ? (
                        <Button
                        aria-label={isVisible ? "Hide private key" : "Show private key"}
                        className="h-8 w-8"
                        onClick={toggleVisibility}
                        size="icon"
                        type="button"
                        variant="ghost"
                        >
                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    ) : null
                }
            </div>
        </div>
    )
}