const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const locateBtn = document.getElementById('locate-btn');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');

const cityNameEl = document.getElementById('city-name');
const updatedAtEl = document.getElementById('updated-at');
const weatherIconEl = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const descriptionEl = document.getElementById('description');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const forecastListEl = document.getElementById('forecast-list');
const forecastTitleEl = document.getElementById('forecast-title');

// WMO weather code -> [emoji, 한글 설명]
const WEATHER_CODES = {
  0: ['☀️', '맑음'],
  1: ['🌤️', '대체로 맑음'],
  2: ['⛅', '구름 조금'],
  3: ['☁️', '흐림'],
  45: ['🌫️', '옅은 안개'],
  48: ['🌫️', '짙은 안개'],
  51: ['🌦️', '약한 이슬비'],
  53: ['🌦️', '이슬비'],
  55: ['🌧️', '강한 이슬비'],
  56: ['🌧️', '약한 진눈깨비'],
  57: ['🌧️', '진눈깨비'],
  61: ['🌦️', '약한 비'],
  63: ['🌧️', '비'],
  65: ['🌧️', '강한 비'],
  66: ['🌧️', '약한 우박비'],
  67: ['🌧️', '강한 우박비'],
  71: ['🌨️', '약한 눈'],
  73: ['🌨️', '눈'],
  75: ['❄️', '강한 눈'],
  77: ['❄️', '싸락눈'],
  80: ['🌦️', '약한 소나기'],
  81: ['🌧️', '소나기'],
  82: ['⛈️', '강한 소나기'],
  85: ['🌨️', '약한 눈 소나기'],
  86: ['🌨️', '강한 눈 소나기'],
  95: ['⛈️', '뇌우'],
  96: ['⛈️', '약한 우박 뇌우'],
  99: ['⛈️', '강한 우박 뇌우'],
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || ['❓', '알 수 없음'];
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

async function geocodeCityOpenMeteo(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ko&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('지역 검색에 실패했습니다.');
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  const place = data.results[0];
  return {
    name: place.name,
    country: place.country || '',
    admin1: place.admin1 || '',
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

// Open-Meteo's geocoding index misses some Korean place names (e.g. "서울"),
// so fall back to Nominatim, which resolves Korean queries more reliably.
async function geocodeCityNominatim(city) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1&accept-language=ko`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('지역 검색에 실패했습니다.');
  const data = await res.json();
  if (!data || data.length === 0) return null;
  const place = data[0];
  const address = place.address || {};
  return {
    name: address.city || address.town || address.village || place.name || place.display_name.split(',')[0],
    country: address.country || '',
    admin1: address.state || address.province || '',
    latitude: parseFloat(place.lat),
    longitude: parseFloat(place.lon),
  };
}

async function geocodeCity(city) {
  const place = await geocodeCityOpenMeteo(city) || await geocodeCityNominatim(city);
  if (!place) throw new Error('해당 도시를 찾을 수 없습니다.');
  return place;
}

async function fetchWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=16`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('날씨 정보를 가져오지 못했습니다.');
  return res.json();
}

function renderWeather(place, weather) {
  const { current, daily } = weather;
  const [icon, desc] = getWeatherInfo(current.weather_code);

  const locationLabel = [place.name, place.admin1, place.country]
    .filter((part, i, arr) => Boolean(part) && arr.indexOf(part) === i)
    .join(', ');
  cityNameEl.textContent = locationLabel;
  updatedAtEl.textContent = `업데이트: ${new Date(current.time).toLocaleString('ko-KR')}`;

  weatherIconEl.textContent = icon;
  temperatureEl.textContent = `${Math.round(current.temperature_2m)}°C`;
  descriptionEl.textContent = desc;

  feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidityEl.textContent = `${current.relative_humidity_2m}%`;
  windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;

  forecastTitleEl.textContent = `${daily.time.length}일 예보 (최대 제공 기간)`;

  forecastListEl.innerHTML = '';
  daily.time.forEach((dateStr, i) => {
    const [dayIcon] = getWeatherInfo(daily.weather_code[i]);
    const date = new Date(dateStr);
    const dateLabel = date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    const dayLabel = date.toLocaleDateString('ko-KR', { weekday: 'short' });

    const dayEl = document.createElement('div');
    dayEl.className = 'forecast-day';
    dayEl.innerHTML = `
      <span class="day-date">${dateLabel}</span>
      <span class="day-weekday">${dayLabel}</span>
      <span class="day-icon">${dayIcon}</span>
      <span class="day-temp">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</span>
    `;
    forecastListEl.appendChild(dayEl);
  });

  resultEl.classList.remove('hidden');
}

async function searchByCity(city) {
  setStatus('검색 중...');
  resultEl.classList.add('hidden');
  try {
    const place = await geocodeCity(city);
    const weather = await fetchWeather(place.latitude, place.longitude);
    renderWeather(place, weather);
    setStatus('');
  } catch (err) {
    setStatus(err.message || '오류가 발생했습니다.', true);
  }
}

async function searchByCoords(latitude, longitude) {
  setStatus('현재 위치의 날씨를 가져오는 중...');
  resultEl.classList.add('hidden');
  try {
    const weather = await fetchWeather(latitude, longitude);
    renderWeather({ name: '현재 위치', admin1: '', country: '' }, weather);
    setStatus('');
  } catch (err) {
    setStatus(err.message || '오류가 발생했습니다.', true);
  }
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) searchByCity(city);
});

locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('이 브라우저에서는 위치 정보를 사용할 수 없습니다.', true);
    return;
  }
  setStatus('위치 확인 중...');
  navigator.geolocation.getCurrentPosition(
    (pos) => searchByCoords(pos.coords.latitude, pos.coords.longitude),
    () => setStatus('위치 권한이 거부되었습니다.', true)
  );
});
