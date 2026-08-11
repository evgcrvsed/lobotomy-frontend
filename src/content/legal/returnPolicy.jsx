export default function ReturnPolicyContent() {
    return (
        <section className="return-policy">
            <h2 className="return-policy__title">Возврат товаров</h2>

            <p className="return-policy__text">
                Условия и порядок возврата товаров и денежных средств установлены
                в <strong>Публичной оферте (Договоре)</strong>. Для рассмотрения
                заявки на возврат необходимо заполнить{' '}
                <a href="/moneyback.png" download>
                    Заявление на возврат
                </a>.
            </p>

            <figure className="return-policy__figure">
                <img
                    src="/moneyback.png"
                    alt="Шаблон. Скачай, распечатай, заполни."
                    // width={640}
                    // height={480}
                    loading="lazy"
                />
            </figure>
        </section>
    )
}