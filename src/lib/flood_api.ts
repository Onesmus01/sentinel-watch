export interface FloodSummaryItem {
  class: number;
  label: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  pixel_count: number;
  area_km2: number;
  percentage: number;
}

export interface FloodApiResponse {
  success: boolean;

  hazard: {
    id: number;
    name: string;
    hazard_type: string;
  };

  calculation?: {
    summary: FloodSummaryItem[];

    weights: {
      dist_to_river: number;
      rainfall: number;
      landcover: number;
    };

    outputs: {
      fhi_raster: string;
      classes_raster: string;
      diagnostic_map: string;
      hotspot_map: string;
    };
  };

  error?: string;
  details?: string;
}

export async function getFloodAnalysis(): Promise<FloodApiResponse> {
  const response = await fetch(
    "http://127.0.0.1:8000/api/calculations/flood/",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = (await response.json()) as FloodApiResponse;

  if (!response.ok) {
    throw new Error(
      data.details ||
        data.error ||
        `Flood API request failed with status ${response.status}`,
    );
  }

  return data;
}