import React from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="main-container" style={{ borderTop: "2px solid #000", background: "#f5f7f9", minHeight: "100vh" }}>
        {/* WHERE TO HEADING */}
        <h1 className="main-heading" style={{ color: "#000", fontFamily: "sans-serif" }}>Where to?</h1>

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
            <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=300&q=80" alt="Hawa Mahal" />
          </div>
          <div className="thumbnail">
            <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80" alt="Mountain with snow" />
          </div>
          <div style={{ color: 'white', fontSize: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'end', paddingBottom: '20px' }}>...</div>
          <div className="thumbnail">
            <img src="https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=300&q=80" alt="Mountain Peak Person" />
          </div>
          <div className="thumbnail">
            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80" alt="Beach Spit" />
          </div>
        </div>

        {/* WHERE TO NEXT */}
        <div className="where-next-header">
          <h2 className="section-heading">Where to next?</h2>
          <button
            className="where-next-search-btn"
            onClick={() => navigate('/packages')}
          >
            Search Packages
          </button>
        </div>

        <div className="destination-cards">
          {[
            {
              id: "jaipur",
              name: "Jaipur",
              image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
              images: [
                "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80", // Amer Fort
                "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80", // Hawa Mahal
                "https://images.unsplash.com/photo-1600010991444-4ebbdd1e6e96?auto=format&fit=crop&w=800&q=80", // Jal Mahal
                "https://images.unsplash.com/photo-1662551523315-eef4b868bb7d?auto=format&fit=crop&w=800&q=80", // Patrika Gate
                "https://images.unsplash.com/photo-1503418895522-46d6d091a1ae?auto=format&fit=crop&w=800&q=80", // Nahargarh Fort
                "https://images.unsplash.com/photo-1588631168532-a521a007bc9d?auto=format&fit=crop&w=800&q=80"  // City Palace
              ],
              shortDesc: "Jaipur, known as the Pink City, is a historic",
              fullDesc: "Jaipur, the capital of Rajasthan, is a mesmerizing blend of ancient royal heritage and vibrant contemporary culture. Founded in 1727 by Maharaja Sawai Jai Singh II, the city is renowned as the 'Pink City' due to its distinctive pink-colored buildings. This magnificent destination offers world-class attractions including the iconic Hawa Mahal (Palace of Winds) with its 953 intricate pink windows, the stunning Amer Fort perched majestically on the hills, and the Jantar Mantar - an extraordinary collection of astronomical observation instruments recognized by UNESCO. Explore the bustling bazaars of the Old City, indulge in authentic Rajasthani cuisine, witness traditional folk performances, enjoy camel safaris in the surrounding deserts, and shop for exquisite handicrafts and textiles. The city perfectly captures the opulence of Mughal architecture blended with Rajput grandeur, making it an unforgettable journey through time.",
              rate: "₹8,500 / person",
              reviews: "4.8 (1,240 reviews)",
              rating: 4.8,
              features: ["Guided Tours", "Historical Sites", "Local Cuisine", "Photography"]
            },
            {
              id: "uttar-pradesh",
              name: "Uttar Pradesh",
              image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
              images: [
                "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80", // Taj Mahal
                "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80", // Varanasi Ghats
                "https://images.unsplash.com/photo-1627885465224-2c3558fe32b6?auto=format&fit=crop&w=800&q=80", // Mathura
                "https://images.unsplash.com/photo-1608681284545-de0f1dabb69b?auto=format&fit=crop&w=800&q=80",  // Fatehpur Sikri
                "https://images.unsplash.com/photo-1554605963-3dc7c37ed526?auto=format&fit=crop&w=800&q=80", // Agra Fort
                "https://images.unsplash.com/photo-1626082928503-242203901b52?auto=format&fit=crop&w=800&q=80"  // Awadh (Lucknow)
              ],
              shortDesc: "UP is a land of diverse beauty, blending",
              fullDesc: "Uttar Pradesh is India's spiritual and cultural heartland, home to some of the world's most revered destinations. This historic state showcases an incredible tapestry of Mughal, Hindu, and British colonial heritage spanning centuries. The magnificent Taj Mahal in Agra stands as an eternal symbol of love and represents the pinnacle of Indo-Islamic architecture - a UNESCO World Heritage Site that captivates millions annually. Varanasi, one of the world's oldest continuously inhabited cities, is Hinduism's holiest pilgrimage destination situated on the sacred banks of the Ganges River, where ancient rituals and spiritual traditions continue unabated. Explore the mystical ghats with their evening Ganga Aarti ceremonies, visit Mathura - the birthplace of Lord Krishna with its vibrant temples, discover the lesser-known gem of Fatehpur Sikri with its abandoned palatial architecture, and experience Lucknow's refined Awadhi cuisine and colonial charm. Uttar Pradesh offers an immersive spiritual journey combined with world-class monuments, rich cultural experiences, and authentic encounters with age-old traditions.",
              rate: "₹6,900 / person",
              reviews: "4.6 (980 reviews)",
              rating: 4.6,
              features: ["Taj Mahal Visit", "Spiritual Walks", "Cultural Shows"]
            },
            {
              id: "new-delhi",
              name: "New Delhi",
              image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
              images: [
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80", // India Gate
                "https://images.unsplash.com/photo-1584283842183-113aa0b543ac?auto=format&fit=crop&w=800&q=80", // Red Fort
                "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80", // Humayun Tomb
                "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=800&q=80",  // Qutub Minar
                "https://images.unsplash.com/photo-1582236894056-bb984d5df61a?auto=format&fit=crop&w=800&q=80", // Lotus Temple
                "https://images.unsplash.com/photo-1585223049282-373302bc6e57?auto=format&fit=crop&w=800&q=80"  // Akshardham / City
              ],
              shortDesc: "Delhi, India's dynamic capital, seamlessly",
              fullDesc: "New Delhi, India's vibrant capital city, is a dynamic metropolis where ancient history meets cutting-edge modernity in perfect harmony. This cosmopolitan hub captivates visitors with its magnificent monuments, thriving cultural scene, world-class architecture, and vibrant street life. Discover the imposing Red Fort (Lal Qila), the symbol of Mughal power and grandeur, the iconic India Gate memorial standing proud as the nation's symbol of sacrifice, and the soaring Qutub Minar - the tallest minaret in India showcasing stunning Indo-Islamic architecture. Wander through the Lodhi Gardens with its serene historic tombs, explore the architectural marvel of the Lotus Temple (Bahai House of Worship), visit the magnificent Rashtrapati Bhawan (official residence of India's President), and experience the spiritual tranquility of Jama Masjid - one of Asia's largest mosques. Indulge in extraordinary street food at Chandni Chowk's bustling bazaar, shop for traditional crafts and textiles at local markets, witness the diverse performing arts scene, and savor authentic Indian and international cuisine. New Delhi offers an intoxicating blend of historical grandeur, spiritual significance, contemporary energy, and unmatched hospitality that makes it an essential destination for any global traveler.",
              rate: "₹7,200 / person",
              reviews: "4.7 (1,500 reviews)",
              rating: 4.7,
              features: ["City Tours", "Shopping", "Food Tasting", "Heritage Walks"]
            },
            {
              id: "kerala",
              name: "Kerala",
              image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
              images: [
                "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80", // Backwaters
                "https://images.unsplash.com/photo-1593693397690-362cb9666c6b?auto=format&fit=crop&w=800&q=80", // Munnar Tea Gardens
                "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80", // Kathakali
                "https://images.unsplash.com/photo-1579789396349-f54f76bedbe5?auto=format&fit=crop&w=800&q=80",  // Beaches
                "https://images.unsplash.com/photo-1611718873752-61d0f507b98d?auto=format&fit=crop&w=800&q=80", // Alleppey
                "https://images.unsplash.com/photo-1629835741703-e8473de0e16c?auto=format&fit=crop&w=800&q=80"  // Periyar
              ],
              shortDesc: "Kerala is called God's Own Country",
              fullDesc: "Kerala, India's enchanting 'God's Own Country', is a tropical paradise that redefines the meaning of natural beauty and serene bliss. Nestled along the Arabian Sea with nearly 600 kilometers of pristine coastline, this southwestern state is a breathtaking symphony of natural wonders waiting to be explored. The legendary backwaters of Kerala - an intricate network of interconnected lagoons, canals, and lakes - offer a mesmerizing journey through lush landscapes aboard traditional houseboats where you can witness the idyllic coastal lifestyle unfold around you. Discover the misty mountains of Munnar with their sprawling tea gardens carpeting the hillsides in verdant green, experience the therapeutic Ayurvedic treatments and wellness therapies that have been perfected over centuries, relax on pristine beaches with swaying coconut palms and golden sands, and explore the serene backwaters of Alleppey with traditional Chinese fishing nets. Trek through Periyar Wildlife Sanctuary home to elephants, tigers, and exotic wildlife, witness the colorful Kathakali dance performances showcasing Kerala's rich artistic heritage, taste the flavors of traditional Kerala cuisine with its abundance of coconut, spices, and fresh seafood, and shop for spices and handicrafts at the vibrant local markets. Kerala perfectly embodies the tropical paradise experience with its perfect blend of relaxation, adventure, cultural immersion, and wellness, making it an ideal destination for rejuvenation and unforgettable memories.",
              rate: "₹12,000 / person",
              reviews: "4.9 (2,100 reviews)",
              rating: 4.9,
              features: ["Houseboat Stay", "Ayurvedic Spa", "Beach Walks", "Tea Estates"]
            }
          ].map((dest) => (
            <div className="dest-card" key={dest.id}>
              <img src={dest.image} alt={dest.name} />
              <div className="dest-overlay">
                <h3>{dest.name}</h3>
              </div>
              <p className="dest-desc">{dest.shortDesc}</p>
              <button
                className="read-more"
                onClick={() => navigate(`/destination/${dest.id}`, { state: dest })}
              >
                Read More <i className="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          ))}
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

        {/* INDUZ CARZ BANNER */}
        <div className="induz-banner-container">
          <div className="induz-header">
            <i className="fa-solid fa-heart induz-logo" style={{ color: "white" }}></i>
            <div className="induz-brand-name">Induz Carz</div>
          </div>

          <h1 className="induz-title">
            Don't just own it Earn it<br />
            All in one place<br />
            Rent And Ride
          </h1>

          <div className="induz-cards-wrapper">
            <div className="induz-card">
              <i className="fa-solid fa-car-side"></i>
              <h4>Free First Ride</h4>
              <p>Get $100 OFF</p>
            </div>

            <div className="induz-card">
              <i className="fa-solid fa-motorcycle"></i>
              <h4>Rent your vehicle</h4>
              <p>Earn your self</p>
            </div>

            <div className="induz-card">
              <i className="fa-solid fa-truck-pickup"></i>
              <h4>Road Assistance</h4>
              <p>24x7</p>
            </div>
          </div>

          <div className="induz-action-container">
            <button className="induz-start-btn">Get start</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
