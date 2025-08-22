# Distance Map

A simple, minimal dark-themed website for placing points on an interactive map and calculating distances between them using OpenStreetMap.

## Features

- **Interactive Map**: Click anywhere on the map to place points
- **Distance Calculation**: Automatically calculates distances between points using the Haversine formula
- **Two Modes**:
  - **Normal Mode**: Place unlimited points and see total distance
  - **Distance Mode**: Place exactly 2 points for precise distance measurement
- **Dark Theme**: Minimal, modern dark UI design
- **Responsive**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: 
  - `C` - Clear all points
  - `Escape` - Exit distance mode

## How to Use

1. **Open the website**: Simply open `index.html` in any modern web browser
2. **Place points**: Click anywhere on the map to place points
3. **View coordinates**: See the exact latitude and longitude of each point
4. **Measure distances**: 
   - In normal mode: Place multiple points to see total distance
   - In distance mode: Place exactly 2 points for precise measurement
5. **Clear points**: Use the "Clear All Points" button to start over

## Controls

- **Clear All Points**: Removes all placed points from the map
- **Toggle Distance Mode**: Switches between normal and distance measurement modes
- **Map Interaction**: Click to place points, drag to pan, scroll to zoom

## Technical Details

- **Map Provider**: OpenStreetMap via Leaflet.js
- **Distance Calculation**: Haversine formula for accurate geographic distances
- **Units**: Displays distances in both kilometers and miles
- **No Dependencies**: Pure HTML, CSS, and JavaScript - no build process required

## Files

- `index.html` - Main HTML structure
- `styles.css` - Dark theme styling
- `script.js` - Map functionality and distance calculations
- `README.md` - This documentation

## Browser Compatibility

Works in all modern browsers that support ES6+ JavaScript:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project uses OpenStreetMap data which is licensed under the Open Data Commons Open Database License (ODbL).
