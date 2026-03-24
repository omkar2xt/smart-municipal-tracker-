export const getCurrentLocation = async () => {
  // TODO: Integrate device GPS provider and permission handling.
  return { lat: null, lng: null, timestamp: Date.now() };
};
