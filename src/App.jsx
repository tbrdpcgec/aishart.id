import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import Order from './pages/Order';
import './App.css';
import { fetchSheet, fetchHome, fetchSettings } from './services/sheets';
import Collection from './components/Collection';
import Tracking from './pages/Tracking';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

const products = [
  {
    id: 'PERSONALIZED_FRAMED_ARTWORK',
    name: 'PERSONALIZED FRAMED ARTWORK',
    description: 'Your personalized artwork, beautifully framed.',
    tag: 'BEST SELLER',
  },
];

export default function App() {
  const [initialProduct, setInitialProduct] = useState(
    'Personalized Framed Artwork'
  );

  const [home, setHome] = useState({});
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  function goToOrder() {
    setInitialProduct('Personalized Framed Artwork');

    window.setTimeout(() => {
      document.getElementById('order')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  }
  function handleContactAdmin(type) {
    if (!whatsappNumber) {
      alert('WhatsApp admin belum tersedia. Silakan coba lagi.');
      return;
    }

    const messages = {
      consultation:
        'Hello Admin! I would like to consult about your caricature and frame services before placing an order. Could you please assist me?',
      chat: 'Hello Admin! I would like to ask about your caricature and frame services.',
    };

    const message = messages[type] || messages.chat;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    async function testSheets() {
      try {
        const [
          settings,
          products,
          prices,
          homeData,
          frames,
          sizes,
          collection,
        ] = await Promise.all([
          fetchSettings(),
          fetchSheet('products'),
          fetchSheet('prices'),
          fetchHome(),
          fetchSheet('frames'),
          fetchSheet('sizes'),
          fetchSheet('collection'),
        ]);

        setHome(homeData);

        setWhatsappNumber((settings.contact_whatsapp || '').replace(/\D/g, ''));

        console.log('SETTINGS:', settings);
        console.log('PRODUCTS:', products);
        console.log('PRICES:', prices);
        console.log('HOME:', homeData);
        console.log('FRAMES:', frames);
        console.log('SIZES:', sizes);
        console.log('COLLECTION:', collection);
      } catch (error) {
        console.error('GOOGLE SHEETS ERROR:', error);
      }
    }

    testSheets();
  }, []);

  return (
    <>
      <div className="app">
        <Navbar
          onOrderClick={goToOrder}
          onTrackingClick={() => setIsTrackingOpen(true)}
          brandName="aishart.id"
        />

        <main>
          <section className="hero" id="home">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                {home.hero_eyebrow || 'PERSONALIZED ART & THOUGHTFUL GIFTS'}
              </div>

              <h1>
                {home.hero_title_line1 || 'Little moments,'}
                <br />
                <span>{home.hero_title_line2 || 'made timeless.'}</span>
              </h1>

              <p className="hero-description">
                {home.hero_description ||
                  'Ciptakan moment yang berkesan dengan hadiah karikatur yang unik, lucu, dan penuh cerita.'}
              </p>

              <div className="hero-actions">
                <button className="button button-dark" onClick={goToOrder}>
                  Create Your Art <span> ↗</span>
                </button>

                <a className="text-link" href="#collection">
                  Explore Collection <span> ↓</span>
                </a>
              </div>
            </div>

            <div className="hero-visual">
              <div
                className="art-scene"
                style={{
                  backgroundImage: home.hero_image
                    ? `url("${home.hero_image}")`
                    : undefined,
                }}
              >
                <div className="sun-shape" />

                <div className="frame frame-back">
                  <div className="frame-inner back-art">
                    <span className="art-caption">
                      together is a lovely place
                    </span>
                  </div>
                </div>

                <div className="frame frame-front">
                  <div className="frame-inner front-art">
                    <div className="portrait-illustration">
                      <span className="portrait-star star-one">✳</span>
                      <span className="portrait-heart">♥</span>
                      <span className="portrait-star star-two">✦</span>
                    </div>

                    <div className="art-bottomline">OUR FAVORITE PEOPLE ♥</div>
                  </div>
                </div>

                <div className="floating-note">
                  <span className="note-icon">✦</span>
                  <div>
                    <strong>Made personal</strong>
                    <p>Every detail tells a story.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Collection />

          <section className="process section" id="how-it-works">
            <div className="process-intro">
              <div className="eyebrow">HOW IT WORKS</div>
              <h2>
                Your memories.
                <br />
                <span>Our little magic.</span>
              </h2>
              <p>
                Choose your frame and size, share your ideas, review your draft,
                and receive your personalized keepsake.
              </p>
              <button className="button button-dark" onClick={goToOrder}>
                Let's Get Started <span>↗</span>
              </button>
            </div>

            <div className="process-list">
              {[
                [
                  '01',
                  'Choose Your Frame',
                  'Select your preferred frame and size.',
                ],
                [
                  '02',
                  'Share Your Memories',
                  'Upload your photo and preferences.',
                ],
                [
                  '03',
                  'Approve Your Artwork',
                  'Review your draft and revisions.',
                ],
                [
                  '04',
                  'Receive Your Gift',
                  'Get your finished framed artwork.',
                ],
              ].map(([number, title, description]) => (
                <article className="process-step" key={number}>
                  <span className="step-number">{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                  <span className="step-arrow">↗</span>
                </article>
              ))}
            </div>
          </section>

          <Order initialProduct={initialProduct} />
        </main>

        <footer className="footer">
          <a className="brand" href="#home">
            <span className="brand-icon">@</span>
            <span>aishart.id</span>
          </a>

          <p>Making ordinary moments feel extraordinary.</p>

          <div className="footer-credit">
            <button
              type="button"
              className="footer-admin-link"
              onClick={() => {
                if (adminToken) {
                  setIsAdminPanelOpen(true);
                } else {
                  setIsAdminLoginOpen(true);
                }
              }}
            >
              © 2026 aishart.id Studio
            </button>
          </div>
        </footer>
      </div>

      {isTrackingOpen && (
        <div
          className="tracking-modal-overlay"
          onClick={() => setIsTrackingOpen(false)}
        >
          <div className="tracking-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="tracking-modal-close"
              onClick={() => setIsTrackingOpen(false)}
              aria-label="Close tracking"
            >
              ×
            </button>

            <Tracking />
          </div>
        </div>
      )}

      {isAdminLoginOpen && (
        <AdminLogin
          onClose={() => setIsAdminLoginOpen(false)}
          onLoginSuccess={(token) => {
            setAdminToken(token);
            setIsAdminLoginOpen(false);
            setIsAdminPanelOpen(true);
          }}
        />
      )}

      {isAdminPanelOpen && adminToken && (
        <AdminPanel
          token={adminToken}
          onClose={() => setIsAdminPanelOpen(false)}
          onLogout={() => {
            setAdminToken(null);
            setIsAdminPanelOpen(false);
          }}
        />
      )}

      <button
        type="button"
        className="floating-chat-button"
        onClick={() => handleContactAdmin('chat')}
        aria-label="Chat with Admin"
      >
        <svg
          className="floating-chat-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="24"
          height="24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16.04 3C8.9 3 3.1 8.75 3.1 15.84c0 2.25.6 4.45 1.73 6.4L3 29l6.96-1.82a13.1 13.1 0 0 0 6.08 1.53h.01c7.14 0 12.94-5.76 12.94-12.85C28.99 8.75 23.18 3 16.04 3zm0 23.56c-1.88 0-3.72-.5-5.33-1.45l-.38-.22-4.13 1.08 1.1-4.02-.25-.4a10.7 10.7 0 0 1-1.65-5.71c0-5.9 4.82-10.7 10.64-10.7 5.83 0 10.65 4.8 10.65 10.7 0 5.9-4.82 10.72-10.65 10.72zm5.85-8.02c-.32-.16-1.89-.93-2.18-1.03-.3-.1-.51-.16-.73.16-.21.32-.83 1.03-1.02 1.24-.19.22-.38.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.56-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.68 0 1.59 1.16 3.12 1.32 3.33.16.22 2.28 3.47 5.52 4.86.77.33 1.37.53 1.84.68.77.24 1.47.2 2.02.12.62-.1 1.89-.77 2.16-1.51.27-.75.27-1.39.19-1.52-.08-.14-.3-.22-.62-.38z" />
        </svg>

        <span>Chat Admin</span>
      </button>
    </>
  );
}
