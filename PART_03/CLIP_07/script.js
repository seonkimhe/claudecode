const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const WEATHER_CODES = {
  0: ["맑음", "☀️"],
  1: ["대체로 맑음", "🌤️"],
  2: ["구름 조금", "⛅"],
  3: ["흐림", "☁️"],
  45: ["안개", "🌫️"],
  48: ["짙은 안개", "🌫️"],
  51: ["약한 이슬비", "🌦️"],
  53: ["이슬비", "🌦️"],
  55: ["강한 이슬비", "🌦️"],
  56: ["약한 착빙성 이슬비", "🌧️"],
  57: ["착빙성 이슬비", "🌧️"],
  61: ["약한 비", "🌧️"],
  63: ["비", "🌧️"],
  65: ["강한 비", "🌧️"],
  66: ["약한 착빙성 비", "🌧️"],
  67: ["착빙성 비", "🌧️"],
  71: ["약한 눈", "🌨️"],
  73: ["눈", "🌨️"],
  75: ["강한 눈", "❄️"],
  77: ["싸락눈", "❄️"],
  80: ["약한 소나기", "🌦️"],
  81: ["소나기", "🌧️"],
  82: ["강한 소나기", "⛈️"],
  85: ["약한 눈 소나기", "🌨️"],
  86: ["강한 눈 소나기", "❄️"],
  95: ["뇌우", "⛈️"],
  96: ["약한 우박 동반 뇌우", "⛈️"],
  99: ["강한 우박 동반 뇌우", "⛈️"],
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

// Open-Meteo의 지오코딩 검색은 인구순 정렬이 되지 않아, 한글로 된 짧은
// 도시명(예: "부산", "대구")을 검색하면 동명의 작은 마을이 실제 광역시 대신
// 매칭되는 경우가 있다. 자주 검색되는 한국 주요 도시는 로마자 표기로
// 대신 검색해 정확한 결과를 받도록 보정한다.
const KOREAN_CITY_ALIASES = {
  "서울": "Seoul", "서울시": "Seoul", "서울특별시": "Seoul",
  "부산": "Busan", "부산시": "Busan", "부산광역시": "Busan",
  "대구": "Daegu", "대구시": "Daegu", "대구광역시": "Daegu",
  "인천": "Incheon", "인천시": "Incheon", "인천광역시": "Incheon",
  "광주": "Gwangju", "광주시": "Gwangju", "광주광역시": "Gwangju",
  "대전": "Daejeon", "대전시": "Daejeon", "대전광역시": "Daejeon",
  "울산": "Ulsan", "울산시": "Ulsan", "울산광역시": "Ulsan",
  "세종": "Sejong", "세종시": "Sejong", "세종특별자치시": "Sejong",
  "수원": "Suwon", "수원시": "Suwon",
  "제주": "Jeju", "제주시": "Jeju", "제주특별자치도": "Jeju",
  "청주": "Cheongju", "청주시": "Cheongju",
  "전주": "Jeonju", "전주시": "Jeonju",
  "포항": "Pohang", "포항시": "Pohang",
  "창원": "Changwon", "창원시": "Changwon",
};

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const locateBtn = document.getElementById("locate-btn");
const statusEl = document.getElementById("status");
const currentSection = document.getElementById("current-weather");
const forecastSection = document.getElementById("forecast");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function weatherInfo(code) {
  return WEATHER_CODES[code] || ["알 수 없음", "❓"];
}

async function geocodeCity(name) {
  const query = KOREAN_CITY_ALIASES[name.trim()] || name;
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=10&language=ko&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("위치 검색에 실패했습니다.");
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`"${name}" 지역을 찾을 수 없습니다.`);
  }
  // 결과가 여러 개면 인구가 가장 많은 지역을 우선한다 (동명 소도시 오매칭 방지).
  const r = data.results.reduce((best, cur) =>
    (cur.population || 0) > (best.population || 0) ? cur : best
  );
  const parts = [r.name, r.admin1, r.country].filter(
    (part, i, arr) => part && arr.indexOf(part) === i
  );
  return {
    latitude: r.latitude,
    longitude: r.longitude,
    label: parts.join(", "),
    timezone: r.timezone,
  };
}

async function fetchWeather(latitude, longitude, timezone) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: timezone || "auto",
    forecast_days: "5",
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error("날씨 정보를 가져오지 못했습니다.");
  return res.json();
}

function renderCurrent(locationLabel, data) {
  const cur = data.current;
  const [desc, icon] = weatherInfo(cur.weather_code);

  document.getElementById("location-name").textContent = locationLabel;
  document.getElementById("location-time").textContent = new Date(cur.time).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  document.getElementById("current-icon").textContent = icon;
  document.getElementById("current-temp").textContent = `${Math.round(cur.temperature_2m)}°C`;
  document.getElementById("current-desc").textContent = desc;
  document.getElementById("feels-like").textContent = `${Math.round(cur.apparent_temperature)}°C`;
  document.getElementById("humidity").textContent = `${cur.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${Math.round(cur.wind_speed_10m)} km/h`;

  currentSection.classList.remove("hidden");
}

function renderForecast(data) {
  const daily = data.daily;
  const list = document.getElementById("forecast-list");
  list.innerHTML = "";

  daily.time.forEach((dateStr, i) => {
    const [desc, icon] = weatherInfo(daily.weather_code[i]);
    const date = new Date(dateStr);
    const dayName = i === 0 ? "오늘" : DAY_NAMES[date.getDay()];

    const el = document.createElement("div");
    el.className = "forecast-day";
    el.title = desc;
    el.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-icon">${icon}</div>
      <div class="day-temp">
        <span class="max">${Math.round(daily.temperature_2m_max[i])}°</span>
        <span class="min">${Math.round(daily.temperature_2m_min[i])}°</span>
      </div>
    `;
    list.appendChild(el);
  });

  forecastSection.classList.remove("hidden");
}

async function loadWeatherForCity(name) {
  setStatus("검색 중...");
  currentSection.classList.add("hidden");
  forecastSection.classList.add("hidden");
  try {
    const place = await geocodeCity(name);
    const data = await fetchWeather(place.latitude, place.longitude, place.timezone);
    renderCurrent(place.label, data);
    renderForecast(data);
    setStatus("");
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function loadWeatherForCoords(latitude, longitude) {
  setStatus("현재 위치 날씨를 가져오는 중...");
  currentSection.classList.add("hidden");
  forecastSection.classList.add("hidden");
  try {
    const data = await fetchWeather(latitude, longitude, "auto");
    renderCurrent("현재 위치", data);
    renderForecast(data);
    setStatus("");
  } catch (err) {
    setStatus(err.message, true);
  }
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = cityInput.value.trim();
  if (name) loadWeatherForCity(name);
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("이 브라우저는 위치 정보를 지원하지 않습니다.", true);
    return;
  }
  setStatus("위치 확인 중...");
  navigator.geolocation.getCurrentPosition(
    (pos) => loadWeatherForCoords(pos.coords.latitude, pos.coords.longitude),
    () => setStatus("위치 정보를 가져올 수 없습니다.", true)
  );
});

loadWeatherForCity("서울");
