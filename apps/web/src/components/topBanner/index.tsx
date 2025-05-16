import React from 'react'

function TopBanner() {
  return (
    <div className=" bg-brandBlue/[8%] text-brandBlue/80 border-brandBlue/20 w-full border-b p-2 text-center shadow-2xl backdrop-blur-3xl">
      Keyshade Alpha is launching April 30th 5:00 PM IST —{' '}
      <a className="text-brandBlue font-medium" href="https://lu.ma/08j3uc8f">
        {' '}
        Join our Launch Party →{' '}
      </a>
    </div>
  )
}

export default TopBanner
