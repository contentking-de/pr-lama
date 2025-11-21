"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface BookingsChartProps {
  data: { date: string; count: number }[]
}

export default function BookingsChart({ data }: BookingsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Buchungen" />
      </LineChart>
    </ResponsiveContainer>
  )
}

