declare module "sunrise-sunset-js" {
  export function getSunrise(
    latitude: number,
    longitude: number,
    date?: Date
  ): Date | null

  export function getSunset(
    latitude: number,
    longitude: number,
    date?: Date
  ): Date | null

  export function getSunriseAndSunset(
    latitude: number,
    longitude: number,
    date?: Date
  ): { sunrise: Date | null; sunset: Date | null }
}