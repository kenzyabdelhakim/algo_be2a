/**
 * API Service for Cairo Transportation System
 * Connects frontend to the Flask backend
 */

/**
 * Resolves API base so requests work when opening the app via localhost *or* LAN
 * (e.g. Vite "Network" URL). In dev, use same-origin `/api` so Vite proxies to Flask.
 */
function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '/api';
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const body = JSON.parse(text) as { error?: string; message?: string };
    return body.error ?? body.message ?? (text || response.statusText);
  } catch {
    return text || response.statusText;
  }
}

export interface Node {
  id: string;
  name: string;
  type: string;
  population: number;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export interface PathStep {
  nodeId: string;
  nodeName: string;
  isOrigin: boolean;
  isDestination: boolean;
  lat?: number | null;
  lon?: number | null;
  segmentDistance?: number;
  cumulativeDistance?: number;
  segmentTime?: number;
  cumulativeTime?: number;
  congestion?: number;
}

export interface DijkstraResponse {
  success: boolean;
  algorithm: string;
  path: PathStep[];
  summary: {
    totalDistance: number;
    estimatedTime: number;
    numberOfHops: number;
  };
}

export interface EmergencyResponse {
  success: boolean;
  algorithm: string;
  nearestHospital: {
    id: string;
    name: string;
  };
  path: PathStep[];
  summary: {
    totalDistance: number;
    totalTime: number;
    numberOfHops: number;
  };
  alternativeHospitals: Array<{
    id: string;
    name: string;
    travelTime: number;
  }>;
}

export interface InfrastructureRoad {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  distance: number;
  capacity: number;
  cost: number;
  fromLat?: number | null;
  fromLon?: number | null;
  toLat?: number | null;
  toLon?: number | null;
}

export interface InfrastructureResponse {
  success: boolean;
  algorithm: string;
  selectedRoads: InfrastructureRoad[];
  summary: {
    totalCost: number;
    numberOfRoads: number;
    isStronglyConnected: boolean;
    activeNodes: number;
    totalEdges: number;
    numberOfSCCs?: number;
  };
  sccs?: Array<{
    id: number;
    size: number;
    nodes: string[];
  }>;
  hospitals?: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
  }>;
  facilities?: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
  }>;
}

export interface AlgorithmResult {
  algorithm: string;
  executionTime: number;
  pathLength: number;
  nodesVisited: number;
  path: string[];
}

export interface CompareResponse {
  success: boolean;
  results: AlgorithmResult[];
  fastest: string;
  summary: {
    source: string;
    destination: string;
  };
}

export interface DashboardStats {
  success: boolean;
  trafficDensityPercent: number;
  avgTravelTimeMin: number;
  activeRoutes: number;
  efficiencyGainPercent: number;
}

export interface TransitResponse {
  status: string;
  path?: string[];
  path_names?: string[];
  total_time_min?: number;
  total_distance_km?: number;
  time_of_day?: string;
  mode?: string;
  message?: string;
  cache_hit?: boolean;
}

/**
 * Fetch all available nodes
 */
export async function fetchNodes(): Promise<Node[]> {
  const response = await fetch(`${getApiBaseUrl()}/nodes`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
}

/**
 * Calculate shortest path using Dijkstra's algorithm
 */
export async function calculateDijkstraRoute(
  source: string,
  destination: string
): Promise<DijkstraResponse> {
  const response = await fetch(`${getApiBaseUrl()}/dijkstra`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source, destination }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Find fastest route to nearest hospital using A* algorithm
 */
export async function findNearestHospital(
  location: string
): Promise<EmergencyResponse> {
  const response = await fetch(`${getApiBaseUrl()}/emergency`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ location }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Get infrastructure planning using MST (Kruskal's algorithm)
 */
export async function getInfrastructurePlan(): Promise<InfrastructureResponse> {
  const response = await fetch(`${getApiBaseUrl()}/infrastructure`);
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Compare different pathfinding algorithms
 */
export async function compareAlgorithms(
  source: string,
  destination: string
): Promise<CompareResponse> {
  const response = await fetch(`${getApiBaseUrl()}/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source, destination }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Aggregated metrics for the main dashboard (derived from the live graph).
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${getApiBaseUrl()}/dashboard`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json();
}

/**
 * Public transit / weighted road routing (memoized Dijkstra), or fewest-hops path.
 */
export async function fetchTransitRoute(
  source: string,
  destination: string,
  mode: 'time' | 'hops' = 'time',
  timeOfDay: string = 'morning'
): Promise<TransitResponse> {
  const response = await fetch(`${getApiBaseUrl()}/transit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source,
      destination,
      mode,
      time_of_day: timeOfDay,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  status: string;
  message: string;
  nodes?: number;
  edges?: number;
}> {
  const response = await fetch(`${getApiBaseUrl()}/health`);
  if (!response.ok) {
    throw new Error('Backend is not responding');
  }
  return response.json();
}

/**
 * Hospital data from Overpass API
 */
export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

/**
 * Bus allocation route data
 */
export interface BusRoute {
  routeId: string;
  stops: string[];
  stopNames: string[];
  currentBuses: number;
  optimizedBuses: number;
  dailyDemand: number;
  roundTripKm: number;
  roundTripMin: number;
  currentThroughput: number;
  optimizedThroughput: number;
  throughputChange: number;
  currentHeadway: number;
  optimizedHeadway: number;
}

export interface BusAllocationResponse {
  success: boolean;
  algorithm: string;
  routes: BusRoute[];
  summary: {
    totalFleet: number;
    minPerRoute: number;
    currentTotalThroughput: number;
    optimizedTotalThroughput: number;
    improvement: number;
    improvementPercent: number;
  };
}

/**
 * Road maintenance data
 */
export interface MaintenanceRoad {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  condition: number;
  distanceKm: number;
  capacity: number;
  repairCost: number;
  timeSavedMin: number;
  fromLat?: number | null;
  fromLon?: number | null;
  toLat?: number | null;
  toLon?: number | null;
}

export interface RoadMaintenanceResponse {
  success: boolean;
  algorithm: string;
  selectedRoads: MaintenanceRoad[];
  summary: {
    budget: number;
    totalCost: number;
    remainingBudget: number;
    numberOfRoads: number;
    totalTimeSaved: number;
    totalCandidates: number;
  };
  allCandidates: Array<{
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    condition: number;
    repairCost: number;
    timeSavedMin: number;
  }>;
}

/**
 * Transit analysis data
 */
export interface TransitAnalysisResponse {
  success: boolean;
  busRoutes: Array<{
    routeId: string;
    stops: string[];
    stopNames: string[];
    currentBuses: number;
    dailyDemand: number;
    roundTripKm: number;
    roundTripMin: number;
  }>;
  metroLines: Array<{
    lineId: string;
    name: string;
    stations: string[];
    stationNames: string[];
    dailyPassengers: number;
  }>;
  summary: {
    totalBuses: number;
    totalBusDemand: number;
    totalMetroPassengers: number;
    numberOfBusRoutes: number;
    numberOfMetroLines: number;
  };
  maintenance: {
    totalCandidates: number;
    totalPotentialCost: number;
    totalPotentialTimeSaved: number;
  };
}

/**
 * Fetch nearby hospitals from OpenStreetMap Overpass API
 */
export async function fetchNearbyHospitals(
  lat: number,
  lon: number,
  radiusKm: number = 5
): Promise<Hospital[]> {
  const radiusMeters = radiusKm * 1000;
  
  // Overpass API query to find hospitals within radius
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
      relation["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse and format hospital data
    const hospitals: Hospital[] = data.elements
      .map((element: any) => {
        // Get coordinates (nodes have lat/lon directly, ways/relations have center)
        const elementLat = element.lat || element.center?.lat;
        const elementLon = element.lon || element.center?.lon;
        
        if (!elementLat || !elementLon) return null;

        // Calculate distance from origin
        const distance = calculateDistance(lat, lon, elementLat, elementLon);

        return {
          id: `osm_${element.type}_${element.id}`,
          name: element.tags?.name || element.tags?.['name:en'] || 'Unnamed Hospital',
          lat: elementLat,
          lon: elementLon,
          distance: distance,
        };
      })
      .filter((h: Hospital | null): h is Hospital => h !== null)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort by distance

    return hospitals;
  } catch (error) {
    console.error('Error fetching hospitals from Overpass API:', error);
    throw new Error('Failed to fetch nearby hospitals from OpenStreetMap');
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find fastest route to nearest hospital using A* with dynamic hospitals
 */
export async function findNearestHospitalWithCoordinates(
  location: string,
  hospitals: Hospital[]
): Promise<EmergencyResponse> {
  const response = await fetch(`${getApiBaseUrl()}/emergency-dynamic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      location,
      hospitals: hospitals.map(h => ({
        id: h.id,
        name: h.name,
        lat: h.lat,
        lon: h.lon,
      }))
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Get optimal bus fleet allocation using DP
 */
export async function getBusAllocation(
  fleet: number = 214,
  minPerRoute: number = 5
): Promise<BusAllocationResponse> {
  const response = await fetch(`${getApiBaseUrl()}/transit/bus-allocation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fleet, minPerRoute }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Get optimal road maintenance allocation using DP
 */
export async function getRoadMaintenance(
  budget: number = 300
): Promise<RoadMaintenanceResponse> {
  const response = await fetch(`${getApiBaseUrl()}/transit/road-maintenance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ budget }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

/**
 * Get comprehensive transit system analysis
 */
export async function getTransitAnalysis(): Promise<TransitAnalysisResponse> {
  const response = await fetch(`${getApiBaseUrl()}/transit/analysis`);

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}
