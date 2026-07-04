import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [location.pathname])

  return (
    <>
      <Header />
      <div className={`page-content${visible ? ' page-visible' : ''}`}>
        <Outlet />
      </div>
      <Footer />
    </>
  )
}
