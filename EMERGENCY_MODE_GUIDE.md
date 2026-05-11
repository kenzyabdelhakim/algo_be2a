# Emergency Mode - User Guide

## How to Use the Enhanced Emergency Mode

### Step 1: Select Your Location
1. Navigate to the **Emergency Mode** tab in the application
2. Click the dropdown menu labeled "Current Location"
3. Select your current location from the list of available nodes
   - Example: "Downtown Cairo (3)", "Maadi (1)", "6th October City (7)"

### Step 2: Activate Emergency Mode
1. Click the **"Activate Emergency"** button
2. The system will:
   - Search for hospitals within 5km radius using OpenStreetMap
   - Display the number of hospitals found
   - Calculate optimal routes to each hospital using A* algorithm
   - Automatically select the hospital with the shortest travel time

### Step 3: View Results

#### Emergency Information Panel
- **Nearest Hospital**: Name and distance of the selected hospital
- **Response Time**: Estimated travel time in minutes
- **Emergency Contact**: Emergency phone number
- **Route Status**: Current traffic conditions

#### Route Details
- Step-by-step directions from your location to the hospital
- Travel time for each segment
- Congestion levels on each road
- Color-coded waypoints:
  - 🟢 Green: Your starting location
  - 🟡 Yellow: Intermediate waypoints
  - 🔴 Red: Hospital destination

#### Interactive Map
- **Your Location**: Green marker
- **Selected Hospital**: Large red marker
- **Other Hospitals**: Smaller pink markers
- **Route**: Red line showing the path
- **Tooltips**: Hover over markers to see names and distances
- **Auto-zoom**: Map automatically fits to show all relevant locations

#### Alternative Hospitals
- List of other nearby hospitals
- Travel time to each alternative
- Useful if the nearest hospital is unavailable

### Understanding the Results

#### Travel Time Calculation
The system considers:
- Road distance
- Traffic congestion (morning peak data)
- Road capacity
- Effective speed based on current conditions

#### Hospital Selection
The algorithm automatically chooses the hospital with:
- Lowest total travel time
- Considering both road network and direct distance
- Real-time path optimization using A* algorithm

### Loading States

#### "Searching for nearby hospitals..."
- The system is querying OpenStreetMap
- Typically takes 2-5 seconds
- Searches within 5km radius

#### "Finding Hospital..."
- Running A* algorithm on all hospitals
- Calculating optimal routes
- Selecting best option

### Error Messages

#### "No hospitals found within 5km radius"
**Solution**: Try selecting a different location closer to urban areas

#### "Failed to fetch nearby hospitals from OpenStreetMap"
**Solution**: 
- Check your internet connection
- Wait a moment and try again
- The Overpass API may be temporarily busy

#### "Invalid location node"
**Solution**: Select a valid location from the dropdown menu

#### "No hospital is reachable from this location"
**Solution**: The selected location may be isolated in the road network

### Tips for Best Results

1. **Urban Areas**: Locations in city centers typically have more hospitals nearby
2. **Network Coverage**: Ensure your selected location is well-connected in the road network
3. **Retry**: If the first search fails, wait a moment and try again
4. **Alternative Hospitals**: Check the alternatives list if you need options

### Technical Details

#### Data Source
- Hospitals: OpenStreetMap via Overpass API
- Roads: Cairo Transportation System graph
- Traffic: Morning peak congestion data

#### Search Radius
- Default: 5 kilometers
- Measured as straight-line distance
- Actual travel distance may be longer

#### Algorithm
- **A* Search**: Optimal pathfinding algorithm
- **Heuristic**: Euclidean distance with latitude correction
- **Weight**: Travel time considering congestion

### Example Scenarios

#### Scenario 1: Downtown Emergency
```
Location: Downtown Cairo (3)
Result: Multiple hospitals found
Nearest: Qasr El Aini Hospital
Time: ~8 minutes
```

#### Scenario 2: Suburban Emergency
```
Location: 6th October City (7)
Result: Fewer hospitals, longer distance
Nearest: Nearest available hospital
Time: ~15-20 minutes
```

#### Scenario 3: Airport Emergency
```
Location: Cairo Airport (F1)
Result: Hospitals in nearby districts
Nearest: Closest accessible hospital
Time: ~12 minutes
```

### Frequently Asked Questions

**Q: How accurate is the hospital data?**
A: Hospital data comes from OpenStreetMap, which is community-maintained and generally accurate for major hospitals.

**Q: Does it show real-time hospital availability?**
A: No, the system shows locations and routes only. Call ahead to confirm availability.

**Q: Can I change the search radius?**
A: Currently set to 5km. This can be modified in the code if needed.

**Q: What if no hospitals appear on the map?**
A: This may indicate no hospitals are registered in OpenStreetMap for that area, or they're beyond the 5km radius.

**Q: Is the travel time accurate?**
A: Travel times are estimates based on road network, distance, and traffic patterns. Actual times may vary.

**Q: Can I select a specific hospital?**
A: The system automatically selects the optimal hospital. Alternative hospitals are shown for reference.

### Emergency Contacts

**General Emergency**: 123 (Egypt)
**Ambulance**: 123
**Police**: 122
**Fire**: 180

### Disclaimer

This system is designed for route planning and information purposes. In a real emergency:
1. Call emergency services immediately (123)
2. Follow professional medical advice
3. Use this tool as a supplementary planning aid

The system provides estimated routes based on available data and may not reflect real-time conditions, road closures, or hospital availability.

---

**Last Updated**: May 2026
**Version**: 2.0 with Overpass API Integration
