import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as VKID from '@vkid/sdk'
import { api } from '../api/client'
import { getToken, setToken } from '../auth'
import logoBlack from '../assets/images/logo-black.png'
import '../styles/pages/login.css'

const VK_APP_ID = Number(import.meta.env.VITE_VK_APP_ID) || 0

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const vkContainerRef = useRef(null)

  // уже вошли — на странице входа делать нечего
  useEffect(() => {
    if (getToken()) navigate('/profile', { replace: true })
  }, [navigate])

  function onLoggedIn(token) {
    setToken(token)
    navigate('/profile', { replace: true })
  }

  // кнопка VK ID рисуется самим SDK в контейнер
  useEffect(() => {
    if (!VK_APP_ID || !vkContainerRef.current) return

    VKID.Config.init({
      app: VK_APP_ID,
      redirectUrl: `${window.location.origin}/login`,
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: 'email',
    })

    const oneTap = new VKID.OneTap()
    oneTap.render({ container: vkContainerRef.current, showAlternativeLogin: false })
    oneTap.on(VKID.WidgetEvents.ERROR, () => setError('VK ID: не удалось загрузить виджет'))
    oneTap.on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async ({ code: vkCode, device_id: deviceId }) => {
      try {
        const { access_token: accessToken } = await VKID.Auth.exchangeCode(vkCode, deviceId)
        const res = await api.vkLogin(accessToken)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setError(err.detail ?? 'Не удалось войти')
          return
        }
        onLoggedIn((await res.json()).token)
      } catch {
        setError('Не удалось войти через VK ID')
      }
    })

    return () => oneTap.close()
  }, [])

  async function sendCode(e) {
    e?.preventDefault()
    if (!email.trim() || busy) return

    setError(null)
    setBusy(true)
    try {
      const res = await api.requestEmailCode(email.trim())
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.detail ?? 'Не удалось отправить код')
        return
      }
      setStep('code')
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(e) {
    e?.preventDefault()
    if (!code.trim() || busy) return

    setError(null)
    setBusy(true)
    try {
      const res = await api.verifyEmailCode(email.trim(), code.trim())
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.detail ?? 'Неверный код')
        return
      }
      onLoggedIn((await res.json()).token)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/*<img src={logoBlack} alt="Lobotomy" className="login-card__logo" />*/}
        <h1 className="login-card__title">Вход в LOBOTOMY</h1>
        <p className="login-card__subtitle">Быстрый вход — пришлём код на почту</p>

        {VK_APP_ID > 0 && (
          <>
            <div className="login-card__vk" ref={vkContainerRef} />
            <div className="login-divider">
              <span>или</span>
            </div>
          </>
        )}

        {step === 'email' ? (
          <form className="login-form" onSubmit={sendCode} noValidate>
            <label className="login-label" htmlFor="login-email">
              Почта
            </label>
            <input
              className="login-input"
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="alan.turing@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <button className="login-submit" type="submit" disabled={busy || !email.trim()}>
              {busy ? 'Отправляем...' : 'Отправить код'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={verifyCode} noValidate>
            <p className="login-sent">
              Код отправлен на <strong>{email.trim()}</strong>
            </p>
            <label className="login-label" htmlFor="login-code">
              Код из письма
            </label>
            <input
              className="login-input login-input--code"
              id="login-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <button className="login-submit" type="submit" disabled={busy || !code.trim()}>
              {busy ? 'Проверяем...' : 'Войти'}
            </button>
            <div className="login-actions">
              <button
                type="button"
                className="login-link"
                onClick={() => {
                  setStep('email')
                  setCode('')
                  setError(null)
                }}
              >
                Изменить почту
              </button>
              <button type="button" className="login-link" onClick={sendCode} disabled={busy}>
                Отправить код снова
              </button>
            </div>
          </form>
        )}

        <p className="login-terms">
          Входя, вы соглашаетесь с условиями использования и политикой конфиденциальности
        </p>
      </div>
    </div>
  )
}
