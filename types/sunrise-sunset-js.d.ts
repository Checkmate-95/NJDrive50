declare module "sunrise-sunset-js" {
  /**
   * Returns the sunrise time for a given latitude, longitude, and date.
   * Defaults to today if no date is provided.
   */
  export function getSunrise(
    latitude: number,
    longitude: number,
    date?: Date
  ): Date

  /**
   * Returns the sunset time for a given latitude, longitude, and date.
   * Defaults to today if no date is provided.
   */
  export function getSunset(
    latitude: number,
    longitude: number,
    date?: Date
  ): Date

  /**
   * Returns both sunrise and sunset times for a given latitude, longitude, and date.
   * Defaults to today if no date is provided.
   */
  export function getSunriseAndSunset(
    latitude: number,
    longitude: number,
    date?: Date
  ): { sunrise: Date; sunset: Date }
}