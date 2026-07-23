# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A single-page weather app with no build step: `index.html`, `style.css`, and `script.js` loaded directly by the browser. There is no package.json, bundler, or test framework — this is plain HTML/CSS/vanilla JS.

## Running the app

Open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `npx serve` or VS Code's Live Server). There is no build/compile step.

## Architecture

All logic lives in `script.js` and follows a straight-line flow with no framework:

1. **Geocoding** (`geocodeCity`) — resolves a free-text city name to coordinates via the Open-Meteo geocoding API (`GEOCODE_URL`). Because that API isn't population-ranked, `geocodeCity` picks the highest-population result from the candidates, and `KOREAN_CITY_ALIASES` pre-translates common Korean city names (e.g. "부산" → "Busan") to avoid mismatches with small towns of the same name.
2. **Forecast fetch** (`fetchWeather`) — takes coordinates and calls the Open-Meteo forecast API (`FORECAST_URL`) for current conditions plus a 5-day daily forecast. Neither API requires an API key.
3. **Rendering** (`renderCurrent`, `renderForecast`) — writes results directly into DOM elements by id (defined in `index.html`); there is no virtual DOM or templating.
4. **Weather codes** — `WEATHER_CODES` maps Open-Meteo's numeric weather codes to Korean descriptions + emoji icons; unknown codes fall back via `weatherInfo()`.

Two entry points drive the above: `loadWeatherForCity(name)` (search form submit) and `loadWeatherForCoords(lat, lon)` (📍 geolocation button, via `navigator.geolocation`). The app defaults to loading Seoul's weather on load (`loadWeatherForCity("서울")` at the bottom of `script.js`).

All UI text and city aliasing target a Korean-language audience — keep new user-facing strings in Korean unless told otherwise.
