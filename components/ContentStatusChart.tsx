"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ContentStatusChartProps {
  data: { name: string; pending: number; provided: number }[]
}

export default function ContentStatusChart({ data }: ContentStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="pending" fill="#f97316" name="Content Pending" />
        <Bar dataKey="provided" fill="#a855f7" name="Content Provided" />
      </BarChart>
    </ResponsiveContainer>
  )
}

