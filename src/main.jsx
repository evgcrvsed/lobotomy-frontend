import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Шрифт лежит в самой сборке, а не на Google Fonts: стиль оттуда блокировал
// отрисовку, и на мобильном интернете, где Google медленный или недоступен,
// страница висела пустой до таймаута. Файлы разбиты по алфавитам —
// браузер качает только кириллицу и латиницу, остальное не трогает.
import '@fontsource-variable/montserrat'
import './styles/base.css'
import './styles/components/header.css'
import './styles/components/footer.css'
import './styles/components/buttons.css'
import './styles/components/hello.css'
import App from './App.jsx'
import { trackVisit } from './visits'

trackVisit()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
