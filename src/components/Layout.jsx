import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()
  const [covered, setCovered] = useState(true)

  useEffect(() => {
    setCovered(true)
    // двойной rAF: браузер должен успеть отрисовать белый слой до старта растворения
    let second
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setCovered(false))
    })
    return () => {
      cancelAnimationFrame(first)
      if (second) cancelAnimationFrame(second)
    }
  }, [location.pathname])

  return (
    <>
      <Header />
      <div className="page-content">
        <Outlet />
      </div>
      <Footer />
      <div className={`page-veil${covered ? '' : ' page-veil--hidden'}`} />
    </>
  )
}
