const DividerSVG = ({ className }) => {
  return (
    <svg
      className={className}
      width="263"
      height="2"
      viewBox="0 0 263 2"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="262"
        height="1"
        fill="url(#paint0_linear_3_424)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_3_424"
          x1="262.5"
          y1="1"
          x2="0.5"
          y2="1"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.002" stop-color="#8EE8FF" stop-opacity="0" />
          <stop offset="0.4539" stop-color="#8EE8FF" />
          <stop offset="0.5354" stop-color="#8EE8FF" />
          <stop offset="1" stop-color="#8EE8FF" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default DividerSVG
