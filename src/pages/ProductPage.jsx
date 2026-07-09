import { useState } from 'react'
import previewImg from '../assets/images/preview.webp'
import '../styles/components/hero.css'
import '../styles/pages/product.css'

const SIZES = [
  { label: 'S', length: '47cm', shoulder: '56cm', chest: '60cm', sleeve: '74cm' },
  { label: 'M', length: '48cm', shoulder: '58cm', chest: '62cm', sleeve: '78cm' },
  { label: 'L', length: '51cm', shoulder: '61cm', chest: '63cm', sleeve: '82cm' },
  { label: 'XL', length: '54cm', shoulder: '63cm', chest: '65cm', sleeve: '83cm' },
]

export default function ProductPage() {
  const [size, setSize] = useState('S')
  const [qty, setQty] = useState(1)

  return (
    <div className="product-page">
      {/* Коллаж — одна большая картинка на весь экран, как на главной */}
      <section className="hero">
        <img src={previewImg} alt="" className="hero__img" />
      </section>

      <div className="product-info">
        <div className="product-info__head">
          <nav className="product-breadcrumbs">Главная/Acedia/Zip-Hoodie v1.2</nav>
          <h1 className="product-title">ZIP-HOODIE V1.2</h1>
          <span className="product-price">5500р</span>
        </div>

        <div className="product-columns">
          <div className="product-col">
            <div className="product-block">
              <span className="product-label">Размер</span>
              <select className="product-select" value={size} onChange={(e) => setSize(e.target.value)}>
                {SIZES.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="product-block">
              <span className="product-label">Описание</span>
              <p className="product-text">
                Футер—100% хлопок
                <br />
                Плотность — 300г/м²
                <br />
                Дистресс-элементы
              </p>
            </div>

          </div>

          <div className="product-col product-col--right">
            <button className="product-cart-btn" type="button">
              Добавить в корзину
            </button>

            <div className="product-actions-row">
              <div className="product-qty">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Меньше">
                  −
                </button>
                <span className="product-qty__value">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} aria-label="Больше">
                  +
                </button>
              </div>
              <button className="product-fav-btn" type="button">
                Добавить в избранное
              </button>
            </div>
          </div>
        </div>

        {/* Материал слева, размерная сетка — по центру страницы на его уровне */}
        <div className="product-material-row">
          <div className="product-block">
            <span className="product-label">Материал</span>
            <p className="product-text">
              Футер—100% хлопок
              <br />
              Плотность — 300г/м²
              <br />
              Дистресс-элементы
            </p>
          </div>

          <table className="product-sizes">
            <thead>
              <tr>
                <th />
                <th>Lenght</th>
                <th>Shoulder</th>
                <th>Chest</th>
                <th>Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map((s) => (
                <tr key={s.label}>
                  <td>{s.label} —</td>
                  <td>{s.length}</td>
                  <td>{s.shoulder}</td>
                  <td>{s.chest}</td>
                  <td>{s.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <span />
        </div>

        <div className="product-similar">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div className="product-similar__ph" key={i} />
          ))}
        </div>

        <div className="product-legal">
          <p className="product-legal__copy">© 2025 «LOBOTOMY»</p>
          <p className="product-legal__links">
            PRIVACY POLICY | APPLICATIONS FOR RETURN OF GOODS | RETURNS | REVIEWS | CONTRACT OFFER
          </p>
        </div>
      </div>
    </div>
  )
}
