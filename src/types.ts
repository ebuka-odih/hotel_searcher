export interface HotelResult {
  id: string;
  name: string;
  site: 'Booking.com' | 'Expedia' | 'Agoda' | 'Hotels.com';
  status: 'verified' | 'unclear' | 'unavailable';
  totalPrice: number;
  currency: string;
  priceBreakdown?: string;
  cancellationPolicy: string;
  location: string;
  rating?: number;
  verifiedAt: string;
  bookingUrl: string;
  evidence: {
    steps: { action: string; timestamp: string }[];
    rawJson: any;
    notes: string;
  };
}

export interface VerificationRun {
  id: string;
  city: string;
  checkIn: string;
  checkOut: string;
  guests: { adults: number; children: number };
  rooms: number;
  budget: { min: number; max: number };
  amenities: string[];
  sites: string[];
  mode: 'fast' | 'thorough';
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string;
  results: HotelResult[];
}

export interface AgentLog {
  id: string;
  site?: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
