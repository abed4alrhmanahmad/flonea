import ProductCard from './ProductCard.jsx'

export default function ProductGrid({ products, columns = 4, priorityCount = 0, className = '' }) {
  return (
    <ul className={`product-grid product-grid--${columns} ${className}`} role="list">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
