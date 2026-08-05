import { useEffect, useState } from 'react'

/**
 * Следит за медиазапросом. Нужен там, где на узком экране должна быть
 * не просто другая раскладка, а другая разметка — одним CSS не обойтись.
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)

    // на случай, если ширина изменилась между первым рендером и подпиской
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
