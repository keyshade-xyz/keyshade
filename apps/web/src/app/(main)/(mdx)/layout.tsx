export default function MdxLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  // Create any shared layout or styles here
  return (
    <div className="flex flex-col items-center">
      <div className="mt-[10vw] px-8 md:w-[60vw]">{children}</div>
    </div>
  )
}
