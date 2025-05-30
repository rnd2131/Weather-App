function showResult(response) {
  let currentCity = document.querySelector(".currentCity");
  currentCity.innerHTML = `${response.data.name}`;
  celsiusTemperature = Math.round(response.data.main.temp);
  let defaultTemp = document.querySelector("#current-temp");
  defaultTemp.innerHTML = celsiusTemperature;
  let feels = document.querySelector("#feels");
  let feelsLike = Math.round(response.data.main.feels_like);
  feels.innerHTML = `Feels Like ${feelsLike}°`;
  let humid = document.querySelector("#humidity");
  let humidity = Math.round(response.data.main.humidity);
  humid.innerHTML = `Humidity ${humidity}%`;
  let wind = document.querySelector("#wind");
  let windSpeed = Math.round(response.data.wind.speed);
  wind.innerHTML = `Wind ${windSpeed} km/h`;
  let description = document.querySelector("#description");
  let mainDescription = response.data.weather[0].description;
  description.innerHTML = `${mainDescription}`;
  let iconElement = document.querySelector("#today-icon");
  iconElement.setAttribute(
    "src",
    `imgs/icons/icon_${response.data.weather[0].icon}.svg`
  );
  let fahrenheitLink = document.querySelector("#unit-f");
  let celsiusLink = document.querySelector("#unit-c");
   fahrenheitLink.classList.remove("active");
   celsiusLink.classList.add("active");
  getForecast(response.data.coord);
}

function getForecast(coordinates) {
  let apiKey = "6c60fabe649d33c314498b8aba31de6b";
  let apiUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${apiKey}&units=metric`;
  axios.get(apiUrl).then(displayForecast);
}

function formatDay(timestamp) {
  let date = new Date(timestamp * 1000);
  let day = date.getDay();
  let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[day];
}

function displayForecast(response) {
  let forecast = response.data.daily;
  let forecastElement = document.querySelector("#forecast");
  let forecastHTML = `<div class="row weather_forecast">`;
  forecast.forEach(function (forecastDay, index) {
    if (index < 5) {
      forecastHTML =
        forecastHTML +
        `
                <div class="col-md-2">
                  <p class="dayX">
                    ${formatDay(forecastDay.dt)} <br />
                    <img src="imgs/icons/icon_${
                      forecastDay.weather[0].icon
                    }.svg" alt="rain" /><br />
                    <span class="dayXtemp_max">${Math.round(
                      forecastDay.temp.max
                    )}°</span
                    ><span class="dayXtemp_min">${Math.round(
                      forecastDay.temp.min
                    )}°</span>
                  </p>
                </div>
              `;
    }
  });

  forecastHTML = forecastHTML + `</div>`;
  forecastElement.innerHTML = forecastHTML;
}

function displayFahrenheit(event) {
  event.preventDefault();
  let fahrenheit = Math.round(celsiusTemperature * 1.8 + 32);
  let defaultTemp = document.querySelector("#current-temp");
  defaultTemp.innerHTML = fahrenheit;
  fahrenheitLink.classList.add("active");
  celsiusLink.classList.remove("active");
}

function displayCelsius(event) {
  event.preventDefault();
  let defaultTemp = document.querySelector("#current-temp");
  defaultTemp.innerHTML = celsiusTemperature;
  fahrenheitLink.classList.remove("active");
  celsiusLink.classList.add("active");
}

function searchDefault(city) {
  let apiKey = "6c60fabe649d33c314498b8aba31de6b";
  let apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  
  // Store the city in localStorage
  localStorage.setItem('lastSearchedCity', city);
  
  axios.get(apiUrl).then(showResult).catch(error => {
    console.error("Error fetching weather data:", error);
    // If error, remove from localStorage
    localStorage.removeItem('lastSearchedCity');
  });
}

function searchPosition(event) {
  event.preventDefault();
  let searchBox = document.querySelector("#search-text");
  let city = searchBox.value;
  searchDefault(city);
}

function showPosition(position) {
  let lat = position.coords.latitude;
  let long = position.coords.longitude;
  let apiKey = "6c60fabe649d33c314498b8aba31de6b";
  let apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${apiKey}&units=metric`;
  axios.get(apiUrl).then(showResult);
}

function handleLocationError(error) {
  let errorMessage;
  switch(error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = "Please enable location access to use this feature.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = "Location information is unavailable.";
      break;
    case error.TIMEOUT:
      errorMessage = "Location request timed out.";
      break;
    default:
      errorMessage = "An unknown error occurred.";
  }
  
  alert(errorMessage);
}

async function reverseGeocode(latitude, longitude) {
  const apiKey = "6c60fabe649d33c314498b8aba31de6b";
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
    );
    const data = await response.json();
    return data[0].name;
  } catch (error) {
    console.error("Error getting city name:", error);
    return null;
  }
}

async function checkLocationPermission() {
  try {
    const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
    const permissionAlert = document.querySelector('#permission-alert');
    
    switch (permissionStatus.state) {
      case 'prompt':
        permissionAlert.classList.add('show');
        break;
      case 'denied':
        permissionAlert.innerHTML = `
          <strong>Location Blocked</strong> - Please enable location access in your browser settings.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        permissionAlert.classList.remove('alert-info');
        permissionAlert.classList.add('alert-warning', 'show');
        break;
      case 'granted':
        permissionAlert.classList.remove('show');
        break;
    }

    permissionStatus.addEventListener('change', () => {
      checkLocationPermission();
    });
  } catch (error) {
    console.error('Error checking permission:', error);
  }
}

function navigate() {
  const locationButton = document.querySelector("#location-button");
  const originalHTML = locationButton.innerHTML;
  locationButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  locationButton.disabled = true;

  checkLocationPermission().then(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      locationButton.innerHTML = originalHTML;
      locationButton.disabled = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const cityName = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          
          if (cityName) {
            searchDefault(cityName);
          } else {
            showPosition(position);
          }
        } catch (error) {
          console.error("Error:", error);
          showPosition(position);
        } finally {
          // Reset button state
          locationButton.innerHTML = originalHTML;
          locationButton.disabled = false;
        }
      },
      (error) => {
        handleLocationError(error);
        locationButton.innerHTML = originalHTML;
        locationButton.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}

let currentDate = document.querySelector("#current-date");
let now = new Date();
let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let day = days[now.getDay()];
let hour = now.getHours();
if (hour < 10) {
  hour = `0${hour}`;
}
let minutes = now.getMinutes();
if (minutes < 10) {
  minutes = `0${minutes}`;
}
currentDate.innerHTML = `${day} ${hour}:${minutes}`;

let celsiusTemperature = null;

let searchForm = document.querySelector("#search-form");
searchForm.addEventListener("submit", searchPosition);

let searchButton = document.querySelector("#search-button");
searchButton.addEventListener("click", searchPosition);

let locationButton = document.querySelector("#location-button");
locationButton.addEventListener("click", navigate);

let fahrenheitLink = document.querySelector("#unit-f");
fahrenheitLink.addEventListener("click", displayFahrenheit);

let celsiusLink = document.querySelector("#unit-c");
celsiusLink.addEventListener("click", displayCelsius);

const cities = [
  "New York", "London", "Paris", "Tokyo", "Sydney", "Dubai", "Singapore",
  "Hong Kong", "Moscow", "Berlin", "Rome", "Madrid", "Toronto", "Seoul",
  "Bangkok", "Mumbai", "Istanbul", "Tehran", "Beijing", "Shanghai", 
  "Amsterdam", "Vienna", "Prague", "Stockholm", "Oslo", "Copenhagen",
  "Helsinki", "Brussels", "Lisbon", "Athens", "Warsaw", "Budapest",
  "Dublin", "Edinburgh", "Barcelona", "Milan", "Venice", "Munich",
  "Frankfurt", "Hamburg", "Zurich", "Geneva", "Montreal", "Vancouver",
  "Mexico City", "Rio de Janeiro", "São Paulo", "Buenos Aires", "Lima",
  "Santiago", "Cairo", "Cape Town", "Johannesburg", "Lagos", "Nairobi",
  "Casablanca", "Delhi", "Bangalore", "Chennai", "Kolkata", "Jakarta",
  "Manila", "Kuala Lumpur", "Ho Chi Minh City", "Melbourne", "Brisbane",
  "Auckland", "Wellington", "San Francisco", "Los Angeles", "Chicago",
  "Miami", "Boston", "Washington DC", "Seattle", "Las Vegas", "Denver",
  "Mashhad", "Isfahan", "Karaj", "Shiraz", "Tabriz", "Qom", "Ahvaz", "Kermanshah", "Urmia",
  "Rasht", "Zahedan", "Kerman", "Hamadan", "Yazd", "Ardabil", "Bandar Abbas", "Arak", "Qazvin", "Zanjan",
  "Sanandaj", "Khorramabad", "Gorgan", "Sari", "Bojnord", "Birjand", "Ilam", "Yasuj", "Semnan", "Shahrekord"
];

function showSuggestions(input) {
  const inputValue = input.trim().toLowerCase();
  const suggestionsDiv = document.querySelector("#suggestions");
  
  // Clear previous suggestions
  suggestionsDiv.innerHTML = "";
  
  if (!inputValue) {
    suggestionsDiv.style.display = "none";
    return;
  }

  // Filter cities based on input
  const matchedCities = cities.filter(city => 
    city.toLowerCase().includes(inputValue)
  ).slice(0, 5); // Limit to top 5 suggestions

  if (matchedCities.length > 0) {
    suggestionsDiv.style.display = "block";
    matchedCities.forEach(city => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = city;
      div.addEventListener("click", () => {
        const searchInput = document.querySelector("#search-text");
        searchInput.value = city;
        suggestionsDiv.style.display = "none";
        searchDefault(city);
      });
      suggestionsDiv.appendChild(div);
    });
  } else {
    suggestionsDiv.style.display = "none";
  }
}

// Add this with your other event listeners
let searchInput = document.querySelector("#search-text");
searchInput.addEventListener("input", (e) => showSuggestions(e.target.value));

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.matches("#search-text")) {
    document.querySelector("#suggestions").style.display = "none";
  }
});

document.addEventListener('DOMContentLoaded', () => {
  checkLocationPermission();
  
  // Get last searched city from localStorage, default to "Tehran" if none
  const lastCity = localStorage.getItem('lastSearchedCity') || "Tehran";
  searchDefault(lastCity);
});

function handleKeyboardNavigation(e) {
  const suggestionsDiv = document.querySelector("#suggestions");
  const items = suggestionsDiv.getElementsByClassName("suggestion-item");
  let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

  switch(e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (selectedIndex < items.length - 1) {
        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
        items[selectedIndex + 1].classList.add('selected');
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (selectedIndex > 0) {
        items[selectedIndex].classList.remove('selected');
        items[selectedIndex - 1].classList.add('selected');
      }
      break;
    case 'Enter':
      const selectedItem = document.querySelector('.suggestion-item.selected');
      if (selectedItem) {
        e.preventDefault();
        const city = selectedItem.textContent;
        document.querySelector("#search-text").value = city;
        suggestionsDiv.style.display = "none";
        searchDefault(city);
      }
      break;
  }
}

// Add this to your existing event listeners
searchInput.addEventListener('keydown', handleKeyboardNavigation);
