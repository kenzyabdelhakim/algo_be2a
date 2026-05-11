# Overpass API Integration - Emergency Mode

## Overview
Successfully integrated OpenStreetMap Overpass API into the Emergency Mode to dynamically fetch nearby hospitals and calculate optimal routes using the A* algorithm.

## Features Implemented

### 1. **Dynamic Hospital Fetching**
- Fetches real hospitals from OpenStreetMap within a 5km radius
- Uses Overpass API query to find all amenity=hospital nodes, ways, and relations
- Calculates distance from user location using Haversine formula
- Sorts hospitals by distance for easy selection

### 2. **Backend API Enhancement**
- **New Endpoint**: `POST /api/emergency-dynamic`
- Accepts user location and list of hospitals with coordinates
- Finds nearest graph node to each hospital
- Runs A* algorithm from location to each hospital's nearest node
- Automatically selects hospital with lowest path cost
- Returns complete route with all hospitals for map display

### 3. **Frontend Integration**
- **Overpass API Service** (`src/services/api.ts`):
  - `fetchNearbyHospitals(lat, lon, radiusKm)` - Fetches hospitals from OSM
  - `findNearestHospitalWithCoordinates(location, hospitals)` - Routes to best hospital
  - Haversine distance calculation for accurate measurements

- **Emergency Component** (`src/app/components/Emergency.tsx`):
  - Loading states for hospital fetching
  - Error handling for API failures
  - Hospital count display
  - Interactive map with all hospitals marked
  - Selected hospital highlighted in red
  - Alternative hospitals shown with lighter markers

### 4. **Map Visualization**
- **EmergencyMap Component**:
  - Displays all fetched hospitals as circular markers
  - Selected hospital: Large red marker (10px radius)
  - Other hospitals: Smaller pink markers (7px radius)
  - Route polyline in red from origin to hospital
  - Origin marker in green
  - Intermediate waypoints in yellow
  - Tooltips showing hospital names and distances
  - Auto-fits bounds to show all hospitals and route

### 5. **Loading & Error Handling**
- Loading spinner during hospital search
- Success message showing number of hospitals found
- Error messages for:
  - No hospitals within radius
  - API failures
  - Invalid locations
  - Network errors
- Graceful fallback to empty state

## Technical Details

### Overpass API Query
```javascript
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:5000,lat,lon);
  way["amenity"="hospital"](around:5000,lat,lon);
  relation["amenity"="hospital"](around:5000,lat,lon);
);
out center;
```

### Backend Algorithm
1. Receive location node ID and hospital coordinates
2. For each hospital:
   - Find nearest graph node using Euclidean distance
   - Run A* from location to nearest node
   - Add distance from node to actual hospital
3. Sort by total travel time
4. Return optimal route with all hospital data

### Data Flow
```
User selects location
    ↓
Fetch node coordinates
    ↓
Query Overpass API (5km radius)
    ↓
Parse hospital data (name, lat, lon)
    ↓
Send to backend with location
    ↓
Backend runs A* to each hospital
    ↓
Return optimal route + all hospitals
    ↓
Display on map with markers
```

## API Response Structure

### Emergency Dynamic Response
```json
{
  "success": true,
  "algorithm": "A* with Overpass API",
  "nearestHospital": {
    "id": "osm_node_123",
    "name": "Cairo University Hospital",
    "lat": 30.0444,
    "lon": 31.2357
  },
  "path": [...],
  "summary": {
    "totalDistance": 5.2,
    "totalTime": 12.5,
    "numberOfHops": 4
  },
  "alternativeHospitals": [...],
  "allHospitals": [...]
}
```

## UI Changes
- **No visual changes** to existing UI layout
- Added loading indicators
- Added hospital count badge
- Map now shows real hospital locations
- Maintains all existing emergency information display

## Testing

### Test Scenarios
1. **Select Downtown Cairo (node 3)**
   - Should find multiple hospitals
   - Display route to nearest
   - Show alternatives on map

2. **Select remote location**
   - May find fewer hospitals
   - Should handle gracefully

3. **Network failure**
   - Shows error message
   - Allows retry

4. **No hospitals found**
   - Clear error message
   - Suggests trying different location

## Configuration

### Radius Setting
Default: 5km (configurable in `fetchNearbyHospitals` function)

### Overpass API Endpoint
```
https://overpass-api.de/api/interpreter
```

### Timeout
25 seconds for Overpass queries

## Performance Considerations
- Overpass API calls are cached by the browser
- Hospital search happens once per emergency activation
- Map renders efficiently with Leaflet
- Backend A* runs in parallel for all hospitals

## Future Enhancements
1. Add hospital type filtering (emergency, general, specialized)
2. Cache hospital data for repeated queries
3. Add hospital capacity/availability data
4. Real-time traffic integration
5. Multiple route options display
6. Turn-by-turn navigation

## Dependencies
- **Frontend**: Leaflet for maps, native fetch for API calls
- **Backend**: Flask, NetworkX for A* algorithm
- **External**: OpenStreetMap Overpass API

## Error Handling
- Network timeouts: 25s for Overpass
- Invalid coordinates: Validation before API call
- No hospitals: User-friendly message
- Backend errors: Detailed error messages
- Map rendering: Fallback to placeholder

## Accessibility
- Loading states announced
- Error messages clearly visible
- Map tooltips for screen readers
- Keyboard navigation supported

## Browser Compatibility
- Modern browsers with fetch API
- Leaflet supports IE11+
- Responsive design maintained

## Security
- HTTPS for Overpass API
- Input validation on coordinates
- CORS enabled on backend
- No sensitive data exposed

## Deployment Notes
- No additional dependencies required
- Works with existing Flask server
- No environment variables needed
- Overpass API is free and public

## Success Metrics
✅ Dynamic hospital fetching from OSM
✅ 5km radius search
✅ Hospital markers on map
✅ A* algorithm integration
✅ Automatic best hospital selection
✅ Loading and error states
✅ UI unchanged
✅ Alternative hospitals displayed
✅ Distance calculations accurate
✅ Map auto-fits to content

## Conclusion
The Overpass API integration successfully enhances the Emergency Mode with real-world hospital data while maintaining the existing UI/UX. The system automatically finds and routes to the nearest hospital using the A* algorithm, providing users with accurate emergency routing information.
