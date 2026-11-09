export default function ProductCard({ product, onSelect }) {
  return (
    <article className="product-card">
      <div className={`product-art product-art-${product.id}`}>
        <span className="product-tag">{product.tag}</span>

        <div className="mini-frame">
          <div className={`mini-art mini-art-${product.id}`}>
            {product.id === 'ART' ? (
              <div className="mini-gift">
                <span>✳</span>
                <strong>
                  made
                  <br />
                  for you
                </strong>
                <span>♡</span>
              </div>
            ) : (
              <div className="mini-portrait">
                <span>☺</span>
                <span>✿</span>
                <span>♡</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="product-info">
        <div>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
        </div>
      </div>

      <button
        className="button button-dark product-select"
        onClick={() => onSelect(product.id)}
      >
        Choose Package <span>↗</span>
      </button>
    </article>
  );
}
