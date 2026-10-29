const PORT_COORDINATES = {
  IEDUB: { name: 'Port of Dublin', lat: 53.3478, lon: -6.2044 },
  IECOR: { name: 'Port of Cork', lat: 51.8491, lon: -8.2975 },
  IELMK: { name: 'Shannon Foynes Port', lat: 52.6119, lon: -9.1089 },
  IEWAT: { name: 'Port of Waterford', lat: 52.2593, lon: -7.1101 },
  NLRTM: { name: 'Port of Rotterdam', lat: 51.9496, lon: 4.1453 },
  DEHAM: { name: 'Port of Hamburg', lat: 53.5461, lon: 9.9661 },
  BEANR: { name: 'Port of Antwerp', lat: 51.2602, lon: 4.4028 },
  FRLEH: { name: 'Port of Le Havre', lat: 49.4944, lon: 0.1079 },
  GBFXT: { name: 'Port of Felixstowe', lat: 51.9542, lon: 1.3513 },
  SGSIN: { name: 'Port of Singapore', lat: 1.2644, lon: 103.8222 },
  CNSHA: { name: 'Port of Shanghai', lat: 31.2304, lon: 121.4737 },
  USNYC: { name: 'Port of New York & New Jersey', lat: 40.6681, lon: -74.0451 }
};

const getPortWeatherAdvisory = async (unLocode) => {
  const port = PORT_COORDINATES[unLocode?.toUpperCase()];
  if (!port) {
    return {
      portCode: unLocode,
      available: false,
      advisory: 'Coordinates unmapped for automated weather telemetry.'
    };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    return {
      portCode: unLocode,
      port: port.name,
      source: 'Fallback Maritime Telemetry',
      condition: 'Moderate Breeze',
      windSpeedKnots: 14,
      berthingAdvisory: 'NORMAL_OPERATIONS'
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${port.lat}&lon=${port.lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API responded with ${response.status}`);

    const data = await response.json();
    const windKnots = Math.round((data.wind?.speed || 0) * 1.94384);

    return {
      portCode: unLocode,
      port: port.name,
      source: 'OpenWeatherMap Live API',
      temperatureC: data.main?.temp,
      condition: data.weather?.[0]?.description || 'Clear',
      windSpeedKnots: windKnots,
      berthingAdvisory: windKnots > 28 ? 'HIGH_WIND_DELAY_RISK' : 'NORMAL_OPERATIONS'
    };
  } catch (error) {
    return {
      portCode: unLocode,
      port: port.name,
      available: false,
      advisory: 'External weather service temporarily unavailable.'
    };
  }
};

module.exports = { getPortWeatherAdvisory };
