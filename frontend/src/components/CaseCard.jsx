export default function CaseCard({ data }) {
  const { name, description, price, imageUrl } = data;

  return (
    <article className="case-card">
      <img src={imageUrl} alt={name} loading="lazy" />
      <div className="case-card__body">
        <h2>{name}</h2>
        <p>{description}</p>
      </div>
      <div className="case-card__footer">
        <span className="price">${price.toFixed(2)}</span>
        <button type="button" className="cta-button">
          View Details
        </button>
      </div>
    </article>
  );
}
