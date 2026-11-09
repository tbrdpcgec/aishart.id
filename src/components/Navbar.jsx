export default function Navbar({ onOrderClick, onTrackingClick, brandName }) {
  return (
    <header className="navbar">
      <a className="brand" href="#home">
        <span className="brand-icon">@</span>
        <span>{brandName || 'Little Moments'}</span>
      </a>

      <nav className="nav-links">
        <a href="#collection">Collection</a>
        <a href="#how-it-works">How It Works</a>
      </nav>

      <div className="nav-actions">
        <button
          type="button"
          className="button nav-tracking"
          onClick={onTrackingClick}
        >
          Order Tracking
        </button>

        <button className="button button-dark nav-cta" onClick={onOrderClick}>
          Create Your Art <span>↗</span>
        </button>
      </div>
    </header>
  );
}
