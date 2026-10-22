import ProductCard from './ProductCard.jsx'

export default function ProductGrid({ products, columns = 4, priorityCount = 0, className = '', setMode = false }) {
  return (
    <ul className={`product-grid product-grid--${columns} ${className}`} role="list">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} setMode={setMode} />
        </li>
      ))}
    </ul>
  )
}
