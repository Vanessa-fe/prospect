'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ContactsByStatus, ContactsBySource } from '@/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface ChartsProps {
  contactsByStatus: ContactsByStatus[]
  contactsBySource: ContactsBySource[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658']

export function Charts({ contactsByStatus, contactsBySource }: ChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Graphique par statut */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts par statut</CardTitle>
          <CardDescription>Répartition des contacts selon leur statut</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {contactsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contactsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ statusName, count }) => `${statusName}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {contactsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.statusColor || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graphique par source */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts par source</CardTitle>
          <CardDescription>Origine de vos contacts</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {contactsBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contactsBySource}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="sourceName"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {contactsBySource.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
