import { Flight } from '../types/trip';
import { RouteStop, routeStops } from './route';

export type ItineraryItem =
  | { kind: 'flight'; sortKey: string; flight: Flight }
  | { kind: 'layover'; sortKey: string; airport: string; minutes: number; arrival: string; departure: string }
  | { kind: 'land'; sortKey: string; date: string; from: RouteStop; to: RouteStop };

// "נתב״ג טרמינל 3 (TLV)" -> "TLV"; names without a code are compared as they are
export const airportCode = (airport: string) => airport.match(/\(([A-Z]{3})\)/)?.[1] ?? airport.trim();

const LAYOVER_MAX_MINUTES = 48 * 60;

const minutesBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);

// Flights in order, a layover between flights that continue from the same airport,
// and the overland legs of the route (their exact hour is not planned, so they sit at the start of their day)
export function buildItinerary(flights: Flight[]): ItineraryItem[] {
  const sorted = [...flights].sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  const items: ItineraryItem[] = sorted.map((flight) => ({ kind: 'flight', sortKey: flight.departureTime, flight }));

  sorted.forEach((flight, i) => {
    const next = sorted[i + 1];
    if (!next || airportCode(flight.arrivalAirport) !== airportCode(next.departureAirport)) return;
    const minutes = minutesBetween(flight.arrivalTime, next.departureTime);
    if (minutes <= 0 || minutes > LAYOVER_MAX_MINUTES) return;
    items.push({
      kind: 'layover',
      sortKey: flight.arrivalTime,
      airport: flight.arrivalAirport,
      minutes,
      arrival: flight.arrivalTime,
      departure: next.departureTime,
    });
  });

  routeStops.forEach((to, i) => {
    if (i === 0 || to.arriveBy !== 'land') return;
    items.push({ kind: 'land', sortKey: `${to.start}T00:00:00`, date: to.start, from: routeStops[i - 1], to });
  });

  return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h > 0 ? (h === 1 ? 'שעה' : `${h} שעות`) : '', m > 0 ? `${m} דקות` : ''].filter(Boolean).join(' ו-');
};

// Flights that land or take off during the stay at a destination
export function flightsForStop(stop: RouteStop, flights: Flight[]): Flight[] {
  return flights
    .filter((f) => {
      const dep = f.departureTime.slice(0, 10);
      const arr = f.arrivalTime.slice(0, 10);
      return (dep >= stop.start && dep <= stop.end) || (arr >= stop.start && arr <= stop.end);
    })
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
}
