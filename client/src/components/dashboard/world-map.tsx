"use client"

import React, { useEffect, useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistanceToNowStrict } from "date-fns"
import { Card } from "../ui/card"

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"

const SESSIONS = [
    { id: "asian", name: "Asian", coordinates: [139.6917, 35.6895] as [number, number], start: 0, end: 9, labelOffset: { x: 40, y: 15 } },
    { id: "london", name: "London", coordinates: [-0.1276, 51.5072] as [number, number], labelOffset: { x: 10, y: -45 } },
    { id: "newyork", name: "New York", coordinates: [-74.006, 40.7128] as [number, number], labelOffset: { x: -60, y: 35 } },
]

// New offsets to match screenshot better
const LONDON_START = 8
const LONDON_END = 17
const NY_START = 13
const NY_END = 22
const ASIAN_START = 0 // Tokyo/Sydney combined roughly
const ASIAN_END = 9

export function WorldMapSession() {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const getLocalTime = (tz: string) => {
        return new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: tz
        }).format(currentTime)
    }

    const checkIsActive = (start: number, end: number) => {
        const utcHours = currentTime.getUTCHours()
        if (start < end) return utcHours >= start && utcHours < end
        return utcHours >= start || utcHours < end
    }

    const getCountdown = (start: number, end: number) => {
        const utcHours = currentTime.getUTCHours()
        const utcMinutes = currentTime.getUTCMinutes()
        const utcSeconds = currentTime.getUTCSeconds()

        const isActive = checkIsActive(start, end)
        let targetHour = isActive ? end : start

        let diffHours = targetHour - utcHours
        if (diffHours < 0) diffHours += 24

        let diffMinutes = 59 - utcMinutes
        let diffSeconds = 59 - utcSeconds

        // Adjust hours because we took 59 mins/secs
        if (diffHours > 0) diffHours -= 1

        const label = isActive ? "Closes in" : "Opens in"
        return `${label} ${diffHours}h ${diffMinutes}m ${diffSeconds}s`
    }

    return (
        <div className="relative w-full h-[400px] overflow-visible rounded-2xl bg-transparent p-4">
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 140, center: [10, 30] }}>
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="rgba(30, 41, 59, 0.4)" // slate-800 with transparency
                                stroke="rgba(71, 85, 105, 0.3)" // slate-600 with transparency
                                strokeWidth={0.5}
                                style={{
                                    default: { outline: "none" },
                                    hover: { outline: "none", fill: "rgba(59, 130, 246, 0.2)", opacity: 0.8 },
                                    pressed: { outline: "none" },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {/* Session Markers and Labels */}
                {/* London */}
                <Marker coordinates={[-0.1276, 51.5072]}>
                    <g className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                        <circle r={4} fill="#3b82f6" fillOpacity={checkIsActive(LONDON_START, LONDON_END) ? 1 : 0.3} />
                        <circle r={8} stroke="#3b82f6" strokeWidth={1} fill="none" strokeOpacity={checkIsActive(LONDON_START, LONDON_END) ? 0.5 : 0.1} />
                    </g>
                    <g transform="translate(15, -45)">
                        <foreignObject width="190" height="85" x="0" y="0">
                            <SessionLabel
                                name="London"
                                localTime={getLocalTime("Europe/London")}
                                isActive={checkIsActive(LONDON_START, LONDON_END)}
                                countdown={getCountdown(LONDON_START, LONDON_END)}
                                color="blue"
                            />
                        </foreignObject>
                        <path d="M -15 45 L 0 15" stroke="rgba(59, 130, 246, 0.3)" strokeWidth={1} strokeDasharray="3 3" fill="none" />
                    </g>
                </Marker>

                {/* New York */}
                <Marker coordinates={[-74.006, 40.7128]}>
                    <g className="filter drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
                        <circle r={4} fill="#8b5cf6" fillOpacity={checkIsActive(NY_START, NY_END) ? 1 : 0.3} />
                        <circle r={8} stroke="#8b5cf6" strokeWidth={1} fill="none" strokeOpacity={checkIsActive(NY_START, NY_END) ? 0.5 : 0.1} />
                    </g>
                    <g transform="translate(-200, 35)">
                        <foreignObject width="190" height="85" x="0" y="0">
                            <SessionLabel
                                name="New York"
                                localTime={getLocalTime("America/New_York")}
                                isActive={checkIsActive(NY_START, NY_END)}
                                countdown={getCountdown(NY_START, NY_END)}
                                color="purple"
                            />
                        </foreignObject>
                        <path d="M 200 -35 L 180 0" stroke="rgba(139, 92, 246, 0.3)" strokeWidth={1} strokeDasharray="3 3" fill="none" />
                    </g>
                </Marker>

                {/* Asian */}
                <Marker coordinates={[139.6917, 35.6895]}>
                    <g className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                        <circle r={4} fill="#f59e0b" fillOpacity={checkIsActive(ASIAN_START, ASIAN_END) ? 1 : 0.3} />
                        <circle r={8} stroke="#f59e0b" strokeWidth={1} fill="none" strokeOpacity={checkIsActive(ASIAN_START, ASIAN_END) ? 0.5 : 0.1} />
                    </g>
                    <g transform="translate(40, 15)">
                        <foreignObject width="190" height="85" x="0" y="0">
                            <SessionLabel
                                name="Tokyo"
                                localTime={getLocalTime("Asia/Tokyo")}
                                isActive={checkIsActive(ASIAN_START, ASIAN_END)}
                                countdown={getCountdown(ASIAN_START, ASIAN_END)}
                                color="amber"
                            />
                        </foreignObject>
                        <path d="M -40 -15 L 0 10" stroke="rgba(245, 158, 11, 0.3)" strokeWidth={1} strokeDasharray="3 3" fill="none" />
                    </g>
                </Marker>
            </ComposableMap>
        </div>
    )
}

function SessionLabel({ name, localTime, isActive, countdown, color }: { name: string, localTime: string, isActive: boolean, countdown: string, color: "blue" | "purple" | "amber" }) {
    const colorClasses = {
        blue: "border-blue-500/30 text-blue-400Shadow",
        purple: "border-purple-500/30 text-purple-400",
        amber: "border-amber-500/30 text-amber-400"
    }

    return (
        <div className={`bg-black/60 backdrop-blur-md rounded-xl border border-white/10 p-3 shadow-2xl flex flex-col items-center justify-center min-w-[170px] ${isActive ? "ring-1 ring-emerald-500/30" : ""}`}>
            <div className="flex items-center justify-between w-full mb-1">
                <span className="text-white font-bold text-xs uppercase tracking-wider">{name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {isActive ? "OPEN" : "CLOSED"}
                </span>
            </div>

            <div className={`text-lg font-mono font-bold tabular-nums tracking-tight ${color === "blue" ? "text-blue-400" : color === "purple" ? "text-purple-400" : "text-amber-400"}`}>
                {localTime}
            </div>

            <div className="text-slate-500 text-[9px] font-medium mt-1 whitespace-nowrap uppercase tracking-widest border-t border-white/5 pt-1 w-full text-center">
                {countdown}
            </div>
        </div>
    )
}
