import React from "react";

import MobileBottomNav from "./MobileBottomNav";
import Sidebar from "./Sidebar";
import { postTrackingLocation } from "../../services/api";

const LAST_POSITION_CACHE_KEY = "geosentinel_last_position";

function cacheLastPosition(position) {
  try {
    localStorage.setItem(LAST_POSITION_CACHE_KEY, JSON.stringify(position));
  } catch {
    // Ignore storage failures in restricted contexts.
  }
}

export default function AppLayout({ children }) {
  React.useEffect(() => {
    if (!("geolocation" in navigator)) return undefined;

    let lastSyncMs = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = Number(pos?.coords?.latitude);
        const lng = Number(pos?.coords?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const accuracy = Number.isFinite(pos?.coords?.accuracy) ? pos.coords.accuracy : null;
        const heading = Number.isFinite(pos?.coords?.heading) ? pos.coords.heading : null;
        const speed = Number.isFinite(pos?.coords?.speed) ? pos.coords.speed : 0;

        cacheLastPosition({
          latitude: lat,
          longitude: lng,
          accuracy,
          heading,
          speed,
          capturedAt: Date.now(),
        });

        const now = Date.now();
        if (now - lastSyncMs < 15000) return;
        lastSyncMs = now;

        postTrackingLocation({
          latitude: lat,
          longitude: lng,
          accuracy,
          direction: heading,
          speed,
          movement: Number(speed || 0) > 0.25,
        }).catch(() => {
          // Keep app responsive even when tracking sync fails.
        });
      },
      () => {
        // Permission denied or unavailable; map page will still offer explicit enable flow.
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 12000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <main className="w-full px-4 pb-24 pt-5 md:px-6 lg:px-8 lg:pb-8 lg:pt-8">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
