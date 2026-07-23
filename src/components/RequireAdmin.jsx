import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { clearToken, getToken } from '../auth'

// Обёртка для админских страниц: пускает внутрь только пользователя с is_admin.
// Гостя отправляет на вход, обычного залогиненного — на экран «Нет доступа».
export default function RequireAdmin({ children }) {
  const navigate = useNavigate()
  const [state, setState] = useState('checking') // checking | ok | denied

  useEffect(() => {
    if (!getToken()) {
      navigate('/login', { replace: true })
      return
    }
    api.getMe().then((me) => {
      if (!me) {
        clearToken()
        navigate('/login', { replace: true })
        return
      }
      setState(me.is_admin ? 'ok' : 'denied')
    })
  }, [navigate])

  if (state === 'checking') return <p className="guard-status">Проверка доступа…</p>

  if (state === 'denied') {
    return (
      <div className="guard-denied">
        <p>Доступ только для администраторов</p>
        <Link to="/" className="btn btn--dark">
          На главную
        </Link>
      </div>
    )
  }

  return children
}
