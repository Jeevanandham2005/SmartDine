import React, { useState, useMemo, memo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundFood from './components/BackgroundFood'; 
import cityList from './cities.json'; 
import './App.css';

// --- JUICE LOADER ---
const JuiceLoader = () => (
  <div className="loader-overlay">
    <div className="glass-wrapper">
      <div className="straw"></div>
      <div className="orange-slice"></div>
      <div className="glass">
        <div className="juice"></div>
        <div className="ice-cubes"><span></span><span></span></div>
      </div>
    </div>
    <div className="loader-text">Squeezing Fresh Results...</div>
  </div>
);

function App() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [count, setCount] = useState(3);
  const [page, setPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [hasSearched, setHasSearched] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);
  const [resultTitle, setResultTitle] = useState('');

  // --- CITY AUTOCOMPLETE STATES ---
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityInputRef = useRef(null);

  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.stopPropagation();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleReset = () => {
    setQuery(''); setCity(''); setRestaurants([]); setError('');
    setHasSearched(false); setPage(1); setIsLastPage(false); setResultTitle('');
  };

  // --- CITY SEARCH LOGIC ---
  const handleCityChange = (e) => {
    const input = e.target.value;
    setCity(input);
    
    if (input.length > 0) {
      const matches = cityList.filter(c => 
        c.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredCities(matches);
      setShowCityDropdown(true);
    } else {
      setShowCityDropdown(false);
    }
  };

  const selectCity = (selectedCity) => {
    setCity(selectedCity);
    setShowCityDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRestaurants = async (targetPage, resetList = false, overrideCount = null, overrideQuery = null) => {
    const activeCount = overrideCount || count;
    const activeQuery = overrideQuery || query;
    const apiLimit = activeCount === 'ALL' ? 10 : activeCount;

    if (!city.trim()) { setError("Please enter a City to start!"); return; }

    setLoading(true); setHasSearched(true); setError(''); setShowSettings(false);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery, city, count: apiLimit, page: targetPage }),
      });
      const data = await res.json();
      try {
        const parsedData = JSON.parse(data.answer);
        if (parsedData.length > 0 && parsedData[0].error) {
           if (targetPage === 1) { setRestaurants([]); setError(parsedData[0].error); } 
           else { setIsLastPage(true); }
        } else {
           setRestaurants(parsedData); setPage(targetPage);
           
           // --- TITLE LOGIC FIXED HERE ---
           if (parsedData.length > 0 && parsedData[0].name === "⚠️ Food Only") {
               // If it's a warning, show a neutral title
               setResultTitle("System Notification");
           } else if (activeQuery === "__SURPRISE__MODE__") { 
               setResultTitle(`🎲 Surprise Pick in ${city}`); 
           } else if (activeCount === 'ALL') { 
               setResultTitle(`Exploring Restaurants in ${city}`); 
           } else { 
               setResultTitle(`Top ${parsedData.length} Picks in ${city}`); 
           }
           
           if (parsedData.length < parseInt(apiLimit)) { setIsLastPage(true); } else { setIsLastPage(false); }
        }
      } catch (e) { setError("AI formatting error. Try again."); }
    } catch (err) { console.error(err); setError("Server connection failed."); }
    setLoading(false);
  };

  const handleSearch = (e) => { e.preventDefault(); setIsLastPage(false); fetchRestaurants(1, true); };
  
  const handleSurprise = () => { 
    if (!city.trim()) { setError("Please enter a City first!"); return; }
    setQuery(""); setIsLastPage(true); fetchRestaurants(1, true, 1, "__SURPRISE__MODE__"); 
  };

  const handleLimitChange = (e) => {
    const newCount = e.target.value;
    setCount(newCount);
    if (hasSearched) {
      setIsLastPage(false);
      fetchRestaurants(1, true, newCount);
    }
  };

  const handleNextPage = () => { fetchRestaurants(page + 1, false); };
  const handlePrevPage = () => { if (page > 1) { setIsLastPage(false); fetchRestaurants(page - 1, false); }};

  return (
    <div className="main-wrapper">
      <BackgroundFood />
      {loading && <JuiceLoader />}

      <div style={{position: 'absolute', top: '20px', right: '20px', zIndex: 100}}>
        <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.2)', border:'1px solid white', color:'white', padding:'8px 15px', borderRadius:'20px', cursor:'pointer', fontWeight:'bold', backdropFilter:'blur(5px)'}}>
            Logout ↪
        </button>
      </div>

      <div className={`container ${hasSearched ? 'top-view' : 'centered-view'} page-enter-animation`}>
        
        <header className="header" onClick={handleReset} title="Click to Reset">
          <h1>🍽️ SmartDine</h1><p>AI-Powered Food Discovery</p>
        </header>

        <form className="search-form" onSubmit={handleSearch}>
          <div className="input-row">
            
            <div className="city-search-wrapper" ref={cityInputRef}>
                <input 
                  type="text" 
                  placeholder="City (Required)" 
                  value={city} 
                  onChange={handleCityChange} 
                  onFocus={() => city.length > 0 && setShowCityDropdown(true)}
                  className="input-field" 
                  required 
                  style={{ width: '100%' }}
                />
                
                {showCityDropdown && filteredCities.length > 0 && (
                  <ul className="city-dropdown-list">
                    {filteredCities.map((c, index) => (
                      <li key={index} onClick={() => selectCity(c)}>{c}</li>
                    ))}
                  </ul>
                )}
            </div>

            <input type="text" placeholder="Any specific craving? (or leave empty)" value={query} onChange={(e) => setQuery(e.target.value)} className="input-field main-search" />
            <button type="submit" disabled={loading} className="search-btn">Find Food</button>
            <div className="settings-wrapper">
              <button type="button" className="settings-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">⚙️</button>
              {showSettings && (
                <div className="settings-popup"><label>Results View:</label>
                  <select value={count} onChange={handleLimitChange} className="settings-select">
                    <option value="3">Top 3</option>
                    <option value="5">Top 5</option>
                    <option value="10">Top 10</option>
                    <option value="ALL">Show All (10/page)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <button type="button" className="surprise-btn" onClick={handleSurprise} title="Surprise Me!">🎲 Surprise Me</button>
        </form>

        {error && <div className="error-msg">{error}</div>}
        {restaurants.length > 0 && !error && (<h2 className="results-title">{resultTitle}</h2>)}

        <div className="results-grid">
          {restaurants.map((place, index) => {
            
            // --- WARNING CARD LOGIC ---
            if (place.name === "⚠️ Food Only") {
              return (
                <div key={index} style={{
                    gridColumn: "1 / -1",
                    backgroundColor: "#fff5f5",
                    border: "2px solid #fc8181",
                    borderRadius: "15px",
                    padding: "25px",
                    textAlign: "center",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                    marginTop: "20px"
                }}>
                  <h3 style={{ color: "#c53030", fontSize: "1.5rem", marginBottom: "10px" }}>
                     🚫 I can only talk about Food!
                  </h3>
                  <p style={{ color: "#2d3748", fontSize: "1.1rem" }}>
                    {place.reason}
                  </p>
                </div>
              );
            }

            // --- NORMAL CARD LOGIC ---
            return (
              <div key={index} className="restaurant-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="card-header"><h3>{place.name}</h3><span className="rating">⭐ {place.rating}</span></div>
                <p className="cuisine">{place.cuisine}</p><p className="address">📍 {place.address}</p><p className="cost">💰 {place.cost} for two</p>
                <div className="ai-reason">"{place.reason}"</div>
              </div>
            );
          })}
        </div>

        {restaurants.length > 0 && !error && count === 'ALL' && (
          <div className="pagination">
            <button onClick={handlePrevPage} disabled={loading || page === 1} className={`page-btn ${page === 1 ? 'hidden' : ''}`}>⬅ Previous</button>
            <span className="page-info">Page {page}</span>
            <button onClick={handleNextPage} disabled={loading || isLastPage} className={`page-btn ${isLastPage ? 'hidden' : ''}`}>Next ➡</button>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;