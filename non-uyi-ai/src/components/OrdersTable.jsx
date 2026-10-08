export default function OrdersTable({ orders }) {
  return <section className="panel" aria-labelledby="orders-title">
    <h2 id="orders-title">Buyurtmalar <small>({orders.length})</small></h2>
    {!orders.length ? <p className="muted">Tanlangan filtrlar bo‘yicha buyurtmalar yo‘q.</p> :
      <div className="table-scroll"><table>
        <thead><tr><th>Xabar</th><th>Mahsulot va miqdor</th><th>Manzil</th><th>Vaqt</th></tr></thead>
        <tbody>{orders.map((order) => <tr key={order.id}>
          <td>{order.text}</td>
          <td>{order.items?.map((item) => `${item.name} × ${item.quantity ?? 'aniqlanmagan'}`).join(', ') ?? 'Aniqlanmagan'}</td>
          <td>{order.address ?? 'Aniqlanmagan'}</td><td>{order.time ?? 'Aniqlanmagan'}</td>
        </tr>)}</tbody>
      </table></div>}
  </section>;
}
