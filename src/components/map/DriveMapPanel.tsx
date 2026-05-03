// src/components/map/DriveMapPanel.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  google.maps.SymbolPath referenced only after the API is confirmed
//          loaded — mapsLoaded flag gates all icon useMemo calls so the
//          component never throws ReferenceError on cold render before the
//          Google Maps script has finished loading
// [FIX-2]  Playback reset moved to the toggle button handler — playIndex
//          resets to 0 before playback starts so the effect never sees a
//          stale index on replay. Effect end condition simplified to only
//          stop playback, not reset index.

import { GoogleMap, Polyline, Marker } from '@react-google-maps/api'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'


export type RouteCoord = { lat: number; lng: number }


export type DriveMeta = {
  miles: number
  duration: string
  timeOfDay: 'Day' | 'Night'
}


type DriveMapPanelProps = {
  route?: RouteCoord[]
  activePosition?: RouteCoord | null
  driveMeta?: DriveMeta | null
}


const DEMO_ROUTE: RouteCoord[] = [
  { lat: 40.0583, lng: -74.4057 },
  { lat: 40.065,  lng: -74.39   },
  { lat: 40.072,  lng: -74.37   },
  { lat: 40.08,   lng: -74.35   },
]


export const DriveMapPanel = ({
  route: externalRoute,
  activePosition = null,
  driveMeta = null,
}: DriveMapPanelProps) => {
  const mapRef = useRef<google.maps.Map | null>(null)

  const [showMarkers, setShowMarkers] = useState(true)
  const [showLive,    setShowLive]    = useState(true)
  const [showOptions, setShowOptions] = useState(false)
  const [styleMode,   setStyleMode]   = useState<'light' | 'dark' | 'minimal'>('light')
  const [playback,    setPlayback]    = useState(false)
  const [playIndex,   setPlayIndex]   = useState(0)

  // [FIX-1] Track when the Google Maps API is confirmed ready — icon useMemo
  // calls below depend on this flag so google.maps.SymbolPath is never
  // accessed before the script has finished loading.
  const [mapsLoaded, setMapsLoaded] = useState(false)

  const route = useMemo(
    () => (externalRoute && externalRoute.length > 0 ? externalRoute : DEMO_ROUTE),
    [externalRoute]
  )

  // ─────────────────────────────────────────────
  // MAP THEMES
  // ─────────────────────────────────────────────
  const mapStyles = useMemo(() => {
    switch (styleMode) {
      case 'dark':
        return [
          { elementType: 'geometry',          stylers: [{ color: '#1e1e1e' }] },
          { elementType: 'labels.text.fill',  stylers: [{ color: '#ffffff' }] },
          { featureType: 'road',               stylers: [{ color: '#2c2c2c' }] },
          { featureType: 'water',              stylers: [{ color: '#1f3b4d' }] },
        ]
      case 'minimal':
        return [
          { featureType: 'all',  stylers: [{ saturation: -100 }, { lightness: 20 }] },
          { featureType: 'road', stylers: [{ lightness: 40 }] },
        ]
      default:
        return [
          { featureType: 'all',       elementType: 'geometry',      stylers: [{ color: '#ffffff' }] },
          { featureType: 'road',      elementType: 'geometry',      stylers: [{ color: '#e0e0e0' }] },
          { featureType: 'water',     elementType: 'geometry.fill', stylers: [{ color: '#d6f0ff' }] },
          { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f7f9fc' }] },
        ]
    }
  }, [styleMode])

  // ─────────────────────────────────────────────
  // FIT BOUNDS
  // ─────────────────────────────────────────────
  const fitBounds = useCallback(() => {
    if (!mapRef.current) return
    const bounds = new google.maps.LatLngBounds()
    route.forEach((pt) => bounds.extend(pt))
    if (activePosition) bounds.extend(activePosition)
    mapRef.current.fitBounds(bounds)
  }, [route, activePosition])

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      // [FIX-1] Mark API as ready before any google.maps.SymbolPath access
      setMapsLoaded(true)
      fitBounds()
    },
    [fitBounds]
  )

  // ─────────────────────────────────────────────
  // ROUTE PLAYBACK
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!playback) return
    // [FIX-2] Effect only stops playback at end — does not reset playIndex.
    // playIndex reset is owned by the toggle button handler so replay always
    // starts cleanly from index 0 without a stale-index flicker.
    if (playIndex >= route.length - 1) {
      setPlayback(false)
      return
    }
    const id = setTimeout(() => setPlayIndex((i) => i + 1), 350)
    return () => clearTimeout(id)
  }, [playback, playIndex, route.length])

  const playbackPosition = playback ? route[playIndex] : null

  // ─────────────────────────────────────────────
  // MARKER ICONS
  // [FIX-1] All three icons gated on mapsLoaded — google.maps.SymbolPath
  // is only accessed after onLoad confirms the API is available.
  // ─────────────────────────────────────────────
  const startIcon = useMemo(() => {
    if (!mapsLoaded) return undefined
    return {
      path:         google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale:        8,
      fillColor:    '#00b36b',
      fillOpacity:  1,
      strokeWeight: 2,
      strokeColor:  '#ffffff',
      rotation:     0,
    }
  }, [mapsLoaded])

  const endIcon = useMemo(() => {
    if (!mapsLoaded) return undefined
    return {
      path:         google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale:        8,
      fillColor:    '#ff0066',
      fillOpacity:  1,
      strokeWeight: 2,
      strokeColor:  '#ffffff',
      rotation:     180,
    }
  }, [mapsLoaded])

  const liveIcon = useMemo(() => {
    if (!mapsLoaded) return undefined
    return {
      path:         google.maps.SymbolPath.CIRCLE,
      scale:        10,
      fillColor:    '#00bfff',
      fillOpacity:  0.85,
      strokeWeight: 3,
      strokeColor:  '#ffffff',
    }
  }, [mapsLoaded])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={route[0]}
        zoom={12}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: mapStyles,
        }}
      >
        <Polyline
          path={route}
          options={{
            strokeColor:   '#00bfff',
            strokeOpacity: 0.9,
            strokeWeight:  5,
          }}
        />

        {/* [FIX-1] mapsLoaded guard ensures icons are defined before rendering */}
        {showMarkers && mapsLoaded && (
          <>
            <Marker
              position={route[0]}
              icon={startIcon}
              label={{ text: 'Start', color: '#0A1E5E', fontWeight: 'bold' }}
            />
            <Marker
              position={route[route.length - 1]}
              icon={endIcon}
              label={{ text: 'End', color: '#0A1E5E', fontWeight: 'bold' }}
            />
          </>
        )}

        {showLive && activePosition && mapsLoaded && (
          <Marker position={activePosition} icon={liveIcon} />
        )}
        {playbackPosition && mapsLoaded && (
          <Marker position={playbackPosition} icon={liveIcon} />
        )}
      </GoogleMap>

      {/* ─────────────────────────────────────────────
          RIGHT-SIDE CONTEXT CARD
      ───────────────────────────────────────────── */}
      {driveMeta && (
        <div
          style={{
            position:      'absolute',
            top:           '12px',
            right:         '12px',
            background:    'rgba(8, 25, 74, 0.88)',
            color:         '#ffffff',
            padding:       '12px 16px',
            borderRadius:  '16px',
            fontSize:      '13px',
            lineHeight:    '1.5',
            boxShadow:     '0 4px 14px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(6px)',
            minWidth:      '120px',
          }}
        >
          <div style={{ fontWeight: 700 }}>{driveMeta.miles.toFixed(1)} mi</div>
          <div style={{ opacity: 0.85 }}>{driveMeta.duration}</div>
          <div style={{ opacity: 0.85 }}>{driveMeta.timeOfDay}</div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          FLOATING RECENTER BUTTON
      ───────────────────────────────────────────── */}
      <button
        onClick={fitBounds}
        style={{
          position:     'absolute',
          bottom:       '16px',
          right:        '16px',
          background:   '#00b36b',
          color:        '#ffffff',
          padding:      '10px 14px',
          borderRadius: '12px',
          fontWeight:   'bold',
          boxShadow:    '0 4px 12px rgba(0,0,0,0.25)',
          border:       'none',
          cursor:       'pointer',
        }}
      >
        Recenter
      </button>

      {/* ─────────────────────────────────────────────
          OPTIONS TOGGLE BUTTON
      ───────────────────────────────────────────── */}
      <button
        onClick={() => setShowOptions((v) => !v)}
        style={{
          position:     'absolute',
          top:          '12px',
          left:         '12px',
          background:   '#ffffff',
          border:       '1px solid #d0d7e2',
          borderRadius: '50%',
          width:        '42px',
          height:       '42px',
          fontWeight:   'bold',
          cursor:       'pointer',
          boxShadow:    '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        ☰
      </button>

      {showOptions && (
        <div
          style={{
            position:     'absolute',
            top:          '60px',
            left:         '12px',
            background:   '#ffffff',
            border:       '1px solid #d0d7e2',
            borderRadius: '14px',
            padding:      '12px',
            boxShadow:    '0 6px 18px rgba(0,0,0,0.15)',
            width:        '180px',
            zIndex:       10,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '8px', color: '#08194A' }}>
            Options
          </div>

          <button onClick={() => setStyleMode('light')}   style={optionBtn}>Light Map</button>
          <button onClick={() => setStyleMode('dark')}    style={optionBtn}>Dark Map</button>
          <button onClick={() => setStyleMode('minimal')} style={optionBtn}>Minimal Map</button>

          <hr style={{ margin: '10px 0', opacity: 0.3 }} />

          <button onClick={() => setShowMarkers((v) => !v)} style={optionBtn}>
            {showMarkers ? 'Hide Markers' : 'Show Markers'}
          </button>

          <button onClick={() => setShowLive((v) => !v)} style={optionBtn}>
            {showLive ? 'Hide Live Position' : 'Show Live Position'}
          </button>

          {/* [FIX-2] Reset playIndex to 0 before toggling playback on —
              effect never sees a stale end-of-route index on replay */}
          <button
            onClick={() => {
              setPlayIndex(0)
              setPlayback((v) => !v)
            }}
            style={optionBtn}
          >
            {playback ? 'Stop Playback' : 'Play Route'}
          </button>
        </div>
      )}
    </div>
  )
}


const optionBtn: React.CSSProperties = {
  width:        '100%',
  textAlign:    'left',
  padding:      '8px 6px',
  borderRadius: '8px',
  background:   '#f7f9fc',
  border:       '1px solid #e2e8f0',
  marginBottom: '6px',
  cursor:       'pointer',
  fontSize:     '13px',
  color:        '#08194A',
}