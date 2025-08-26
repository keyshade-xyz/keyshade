function ShareSecretBodyWrapper({ children }: React.PropsWithChildren) {
  return (
    <div
      className="mx-10 flex h-fit min-w-[50vw] flex-col items-center justify-center gap-y-4 rounded-2xl border-2 border-[#B3EBF2]/10 px-7 py-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] backdrop-blur-3xl"
      style={{
        background: `linear-gradient(130.61deg, rgba(12, 86, 96, 0.4) 10%, rgba(25, 177, 198, 0) 80%),
        linear-gradient(0deg, rgba(12, 86, 96, 0.2) 58.4%, rgba(12, 86, 96, 0.3) 80%)`
      }}
    >
      {children}
    </div>
  )
}

export default ShareSecretBodyWrapper
