// Хранение токена авторизации (JWT от нашего бэкенда)
const TOKEN_KEY = 'lobotomy_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}
