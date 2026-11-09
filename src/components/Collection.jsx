import { useEffect, useState } from 'react';
import { fetchSheet, fetchSettings } from '../services/sheets';
import './Collection.css';

export default function Collection() {
  const [frames, setFrames] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  const [frameIndex, setFrameIndex] = useState(0);
  const [category, setCategory] = useState('ALL');
  const [artPage, setArtPage] = useState(0);

  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollection() {
      try {
        const [frameData, sizeData, artworkData, settings] = await Promise.all([
          fetchSheet('frames'),
          fetchSheet('sizes'),
          fetchSheet('collection'),
          fetchSettings(),
        ]);

        setFrames(
          frameData
            .filter((item) => item.active?.toUpperCase() === 'TRUE')
            .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        );

        setSizes(
          sizeData
            .filter((item) => item.active?.toUpperCase() === 'TRUE')
            .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        );

        setArtworks(
          artworkData
            .filter((item) => item.active?.toUpperCase() === 'TRUE')
            .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        );

        setWhatsappNumber((settings.contact_whatsapp || '').replace(/\D/g, ''));
      } catch (error) {
        console.error('COLLECTION ERROR:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCollection();
  }, []);

  useEffect(() => {
    function updatePageSize() {
      setItemsPerPage(window.innerWidth <= 768 ? 2 : 4);
    }

    updatePageSize();
    window.addEventListener('resize', updatePageSize);

    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  const currentFrame = frames[frameIndex];

  const filteredArtworks =
    category === 'ALL'
      ? artworks
      : artworks.filter((item) => item.category?.toUpperCase() === category);

  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage);

  const visibleArtworks = filteredArtworks.slice(
    artPage * itemsPerPage,
    artPage * itemsPerPage + itemsPerPage
  );

  function changeCategory(value) {
    setCategory(value);
    setArtPage(0);
  }

  function changeFrame(direction) {
    setFrameIndex((frameIndex + direction + frames.length) % frames.length);
  }

  const formattedPrice = currentFrame?.price_start
    ? Number(currentFrame.price_start).toLocaleString('id-ID')
    : null;

  const whatsappMessage = currentFrame
    ? `Halo admin, saya ingin bertanya tentang frame ${currentFrame.frame_name}. Boleh minta informasi lebih lanjut?`
    : '';

  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : '';

  if (loading) {
    return <section className="collection-page">Loading collection...</section>;
  }

  return (
    <section className="collection-page" id="collection">
      <div className="collection-top">
        {/* FRAME COLLECTION */}

        <div className="frame-showcase">
          <div className="eyebrow">OUR FRAME COLLECTION</div>

          <h2>
            Choose your <span>frame.</span>
          </h2>

          {currentFrame && (
            <>
              <div className="frame-image">
                <img
                  src={currentFrame.image_url}
                  alt={currentFrame.frame_name}
                />

                <div className="frame-counter">
                  {String(frameIndex + 1).padStart(2, '0')} /{' '}
                  {String(frames.length).padStart(2, '0')}
                </div>
              </div>

              {/* FRAME NAVIGATION */}

              <div className="frame-navigation">
                <button
                  className="frame-arrow"
                  onClick={() => changeFrame(-1)}
                  aria-label="Previous frame"
                >
                  ‹
                </button>

                <h3 className="frame-nav-title">{currentFrame.frame_name}</h3>

                <button
                  className="frame-arrow"
                  onClick={() => changeFrame(1)}
                  aria-label="Next frame"
                >
                  ›
                </button>
              </div>

              {/* FRAME INFORMATION */}

              {/* FRAME INFORMATION */}

              <div className="frame-details">
                <p className="frame-description">{currentFrame.description}</p>

                <div className="frame-detail-item">
                  <span></span>

                  <div className="size-pills">
                    {currentFrame.size_info
                      ?.split(',')
                      .map((size) => size.trim())
                      .filter(Boolean)
                      .map((size, index) => (
                        <span className="size-pill" key={index}>
                          {size}
                        </span>
                      ))}
                  </div>
                </div>

                <a href="#order" className="frame-price-button">
                  <span>Starting From</span>
                  <strong>
                    {formattedPrice ? `Rp ${formattedPrice}` : 'Contact us'}
                  </strong>
                  <span className="price-arrow">↗</span>
                </a>
              </div>
            </>
          )}
        </div>

        {/* SIZE GUIDE */}

        <div className="size-showcase">
          <div className="eyebrow">FIND YOUR PERFECT SIZE</div>

          <h2>
            Size <span>guide.</span>
          </h2>

          <div className="size-guide-images">
            {sizes.map((size) => (
              <div className="size-guide-item" key={size.size_id}>
                <img src={size.image_url} alt={size.size_name} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARTWORK COLLECTION */}

      <div className="artwork-showcase">
        <div className="artwork-heading">
          <div>
            <div className="eyebrow">OUR ARTWORK</div>
            <h2>
              Made just for <span>you.</span>
            </h2>
          </div>

          <div className="category-filter">
            {['ALL', 'INDIVIDUAL', 'COUPLE', 'GROUP'].map((item) => (
              <button
                key={item}
                className={category === item ? 'active' : ''}
                onClick={() => changeCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="artwork-grid">
          {visibleArtworks.map((art) => (
            <div className="artwork-card" key={art.artwork_id}>
              <img src={art.image_url} alt={art.title} />
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="artwork-navigation">
            <button
              disabled={artPage === 0}
              onClick={() => setArtPage(artPage - 1)}
            >
              ‹
            </button>

            <span>
              {artPage + 1} / {totalPages}
            </span>

            <button
              disabled={artPage >= totalPages - 1}
              onClick={() => setArtPage(artPage + 1)}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
