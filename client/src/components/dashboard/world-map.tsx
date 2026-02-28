"use client"

import React, { useEffect, useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistanceToNowStrict } from "date-fns"
import { Card } from "../ui/card"

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"

const SESSIONS = [
    { id: "sydney", name: "Sydney", coordinates: [151.2093, -33.8688] as [number, number], start: 22, end: 7, timezone: "Australia/Sydney", displayTimezone: "AEST" },
    { id: "tokyo", name: "Tokyo", coordinates: [139.6917, 35.6895] as [number, number], start: 0, end: 9, timezone: "Asia/Tokyo", displayTimezone: "JST" },
    { id: "london", name: "London", coordinates: [-0.1276, 51.5072] as [number, number], start: 8, end: 17, timezone: "Europe/London", displayTimezone: "GMT" },
    { id: "newyork", name: "New York", coordinates: [-74.006, 40.7128] as [number, number], start: 13, end: 22, timezone: "America/New_York", displayTimezone: "EST" },
]

export function WorldMapSession() {
    const [hoveredSession, setHoveredSession] = useState<string | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // UTC calculations for session active state
    const utcHours = currentTime.getUTCHours()

    const checkIsActive = (start: number, end: number) => {
        if (start < end) {
            return utcHours >= start && utcHours < end
        }
        // Crosses midnight
        return utcHours >= start || utcHours < end
    }

    return (
        <div className="relative w-full h-[400px] overflow-hidden rounded-2xl bg-black/20 p-4">
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}>
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#1e293b" // slate-800
                                stroke="#334155" // slate-700
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: "none" },
                                    hover: { outline: "none", fill: "#334155" },
                                    pressed: { outline: "none" },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {SESSIONS.map((session) => {
                    const isActive = checkIsActive(session.start, session.end)

                    return (
                        <Marker
                            key={session.id}
                            coordinates={session.coordinates}
                            onMouseEnter={() => setHoveredSession(session.id)}
                            onMouseLeave={() => setHoveredSession(null)}
                        >
                            <g className="cursor-pointer transition-all duration-300">
                                {/* Outer Glow */}
                                {isActive && (
                                    <circle
                                        r={24}
                                        fill="url(#glowGradient)"
                                        className="animate-pulse"
                                        style={{ filter: "blur(2px)", opacity: 0.6 }}
                                    />
                                )}

                                {/* Circle Marker */}
                                <circle
                                    r={6}
                                    fill={isActive ? "#3b82f6" : "#64748b"} // blue-500 : slate-500
                                    stroke="#fff"
                                    strokeWidth={2}
                                />

                                {/* Text Label */}
                                <text
                                    textAnchor="middle"
                                    y={24}
                                    style={{
                                        fontFamily: "system-ui",
                                        fill: isActive ? "#93c5fd" : "#94a3b8", // blue-300 : slate-400
                                        fontSize: "12px",
                                        fontWeight: isActive ? "bold" : "normal",
                                    }}
                                >
                                    {session.name}
                                </text>
                            </g>
                        </Marker>
                    )
                })}

                {/* Global definitions for gradients */}
                <defs>
                    <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                </defs>
            </ComposableMap>

            {/* Hover Tooltip overlay */}
            <AnimatePresence>
                {hoveredSession && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-4 right-4 z-10 w-64"
                    >
                        <TooltipCard session={SESSIONS.find(s => s.id === hoveredSession)!} isActive={checkIsActive(SESSIONS.find(s => s.id === hoveredSession)!.start, SESSIONS.find(s => s.id === hoveredSession)!.end)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function TooltipCard({ session, isActive }: { session: any, isActive: boolean }) {
    // Demo PnL info for the tooltip
    return (
        <Card className="p-4 border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-lg tracking-tight">{session.name}</h4>
                {isActive ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">OPEN</span>
                ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">CLOSED</span>
                )}
            </div>

            <div className="space-y-3 mt-4 text-sm">
                <div className="flex justify-between items-center text-slate-300 border-b border-white/5 pb-2">
                    <span>Session PnL:</span>
                    <span className="text-emerald-400 font-medium">+$1,240.50</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 border-b border-white/5 pb-2">
                    <span>Win Rate:</span>
                    <span className="text-white font-medium">68%</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 pb-1">
                    <span>Trades:</span>
                    <span className="text-white font-medium">14</span>
                </div>
            </div>
        </Card>
    )
}
