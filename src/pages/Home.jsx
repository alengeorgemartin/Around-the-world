import React from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="main-container">
        {/* WHERE TO HEADING */}
        <h1 className="main-heading">Where to?</h1>

        {/* CATEGORY TABS */}
        <div className="category-tabs">
          <div className="cat-tab" onClick={() => navigate('/')}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <span>Search all</span>
          </div>
          <div className="cat-tab" onClick={() => navigate('/create-trip')}>
            <i className="fa-solid fa-route"></i>
            <span>Itenary Generation</span>
          </div>
          <div className="cat-tab" onClick={() => navigate('/packages')}>
            <i className="fa-solid fa-box"></i>
            <span>Package</span>
          </div>
          <div className="cat-tab" onClick={() => navigate('/rentals')}>
            <i className="fa-solid fa-car"></i>
            <span>Rental</span>
          </div>
          <div className="cat-tab" onClick={() => navigate('/hotels')}>
            <i className="fa-solid fa-hotel"></i>
            <span>Hotels</span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="search-container">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" placeholder="Discover places, Things to do" />
          <button className="search-button">search</button>
        </div>

        {/* HERO SECTION */}
        <div className="hero-section">
          <h1 className="hero-title">
            Discover The Beauty<br />
            Do Thing You Like
          </h1>
        </div>

        {/* THUMBNAIL GALLERY */}
        <div className="thumbnail-gallery">
          <div className="thumbnail">
            <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=300&q=80" alt="Jaipur" />
          </div>
          <div className="thumbnail">
            <img src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=300&q=80" alt="Taj Mahal" />
          </div>
          <div className="thumbnail">
            <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=300&q=80" alt="Mountain" />
          </div>
          <div className="thumbnail">
            <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=300&q=80" alt="Beach" />
          </div>
        </div>

        {/* WHERE TO NEXT */}
        <h2 className="section-heading">Where to next?</h2>

        <div className="destination-cards">
          <div className="dest-card">
            <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=400&q=80" alt="Jaipur" />
            <div className="dest-overlay">
              <h3>Jaipur</h3>
            </div>
            <p className="dest-desc">Jaipur, known as the Pink City, is a historic</p>
            <button className="read-more">Read More <i className="fa-solid fa-chevron-down"></i></button>
          </div>

          <div className="dest-card">
            <img src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=400&q=80" alt="Uttar Pradesh" />
            <div className="dest-overlay">
              <h3>Uttar Pradesh</h3>
            </div>
            <p className="dest-desc">UP is a land of diverse beauty, blending</p>
            <button className="read-more">Read More <i className="fa-solid fa-chevron-down"></i></button>
          </div>

          <div className="dest-card">
            <img src="https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=400&q=80" alt="New Delhi" />
            <div className="dest-overlay">
              <h3>New Delhi</h3>
            </div>
            <p className="dest-desc">Delhi, India's dynamic capital, seamlessly</p>
            <button className="read-more">Read More <i className="fa-solid fa-chevron-down"></i></button>
          </div>

          <div className="dest-card">
            <img src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&q=80" alt="Kerala" />
            <div className="dest-overlay">
              <h3>Kerala</h3>
            </div>
            <p className="dest-desc">Kerala is called God's Own Country</p>
            <button className="read-more">Read More <i className="fa-solid fa-chevron-down"></i></button>
          </div>
        </div>

        {/* SMART TRIP PLANNER */}
        <h2 className="section-heading">Smart Trip Planner</h2>
        <h3 className="section-subheading">Itinery Generator</h3>

        <div className="trip-planner-section">
          <div className="planner-badge">
            <i className="fa-solid fa-location-dot"></i> Ai-Powered Maker
          </div>
          <h1 className="planner-title">
            #1 <span className="green-text">Itinerary Trip Planner</span>
          </h1>
          <p className="planner-desc">
            Plan perfect trips in minutes with<br />
            our online itinerary maker AI.<br />
            Create personalized, day-by-day<br />
            itineraries based on your interests<br />
            and destination.
          </p>
          <button className="plan-trip-btn" onClick={() => navigate("/app")}>
            Plan Your Trip
          </button>
        </div>

        {/* FIND HOTELS */}
        <h2 className="section-heading">Find hotels Travelers love</h2>
        <p className="section-subtitle">Best choices</p>

        <div className="hotel-cards">
          <div className="hotel-card">
            <div className="hotel-img-container">
              <img src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=500&q=80" alt="Hotel" />
              <i className="fa-regular fa-heart heart-icon"></i>
              <div className="star-rating">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
            </div>
            <div className="hotel-info">
              <h4>Hotel in Mumbai</h4>
              <p className="hotel-price">$1,340 for 1 night</p>
              <p className="hotel-rating"><i className="fa-solid fa-star"></i> 4.9</p>
            </div>
          </div>

          <div className="hotel-card">
            <div className="hotel-img-container">
              <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=80" alt="Hotel" />
              <i className="fa-regular fa-heart heart-icon"></i>
              <div className="star-rating">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
            </div>
            <div className="hotel-info">
              <h4>Hotel in Delhi</h4>
              <p className="hotel-price">$1,700 for 1 night</p>
              <p className="hotel-rating"><i className="fa-solid fa-star"></i> 4.1</p>
            </div>
          </div>

          <div className="hotel-card">
            <div className="hotel-img-container">
              <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&q=80" alt="Hotel" />
              <i className="fa-regular fa-heart heart-icon"></i>
              <div className="star-rating">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
            </div>
            <div className="hotel-info">
              <h4>Hotel in Kochi</h4>
              <p className="hotel-price">$1,500 for 1 night</p>
              <p className="hotel-rating"><i className="fa-solid fa-star"></i> 3.9</p>
            </div>
          </div>

          <div className="hotel-card">
            <div className="hotel-img-container">
              <img src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=500&q=80" alt="Hotel" />
              <i className="fa-regular fa-heart heart-icon"></i>
              <div className="star-rating">
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
                <i className="fa-solid fa-star"></i>
              </div>
            </div>
            <div className="hotel-info">
              <h4>Hotel in Chennai</h4>
              <p className="hotel-price">$1,900 for 1 night</p>
              <p className="hotel-rating"><i className="fa-solid fa-star"></i> 4.7</p>
            </div>
          </div>
        </div>

        <div className="details-btn-container">
          <button className="details-btn">Details</button>
        </div>
      </div>
    </>
  );
};

export default Home;
