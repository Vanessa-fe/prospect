'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteAgency, updateAgencyStatus } from '@/lib/actions/agencies'
import { useToast } from '@/lib/hooks/use-toast'
import type { AgencyWithRelations, AgencyStatus, AgencySource } from '@/types'
import { Search, Plus, Trash2, Eye, Globe } from 'lucide-react'

interface AgenciesListProps {
  agencies: AgencyWithRelations[]
  statuses: AgencyStatus[]
  sources: AgencySource[]
  totalCount: number
}

export function AgenciesList({ agencies, statuses, sources, totalCount }: AgenciesListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleStatusChange = async (agencyId: string, newStatusId: string) => {
    const result = await updateAgencyStatus(agencyId, newStatusId === 'none' ? null : newStatusId)

    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Statut mis à jour',
      })
      router.refresh()
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    }
  }

  const handleDelete = async (agencyId: string, agencyName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${agencyName} ?`)) {
      return
    }

    setDeletingId(agencyId)

    const result = await deleteAgency(agencyId)

    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Agence supprimée avec succès',
      })
      router.refresh()
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Une erreur est survenue',
      })
    }

    setDeletingId(null)
  }

  // Filtrer les agences côté client
  const filteredAgencies = agencies.filter((agency) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      agency.name.toLowerCase().includes(searchLower) ||
      agency.website?.toLowerCase().includes(searchLower) ||
      agency.city?.toLowerCase().includes(searchLower) ||
      agency.contact_name?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || agency.status_id === statusFilter
    const matchesSource = sourceFilter === 'all' || agency.source_id === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="search"
            placeholder="Rechercher une agence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/agencies/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle agence
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Compteur de résultats */}
      <div className="text-sm text-muted-foreground">
        {filteredAgencies.length} agence{filteredAgencies.length !== 1 ? 's' : ''} trouvée
        {filteredAgencies.length !== 1 ? 's' : ''} sur {totalCount}
      </div>

      {/* Liste des agences */}
      {filteredAgencies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Aucune agence trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Site web</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Stack détectée</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgencies.map((agency) => (
                <TableRow
                  key={agency.id}
                  className="transition-all hover:scale-[1.01] hover:shadow-md"
                  style={{
                    backgroundColor: agency.status ? `${agency.status.color}10` : undefined,
                    borderLeft: agency.status ? `4px solid ${agency.status.color}` : undefined,
                  }}
                >
                  <TableCell>
                    <div className="font-medium">{agency.name}</div>
                    {agency.contact_name && (
                      <span className="text-sm text-muted-foreground">{agency.contact_name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={agency.status_id || 'none'}
                      onValueChange={(value) => handleStatusChange(agency.id, value)}
                    >
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue>
                          {agency.status ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: agency.status.color }}
                              />
                              <span className="text-sm">{agency.status.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Aucun statut</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">Aucun statut</span>
                        </SelectItem>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                              {status.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {agency.website ? (
                      <a
                        href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm inline-flex items-center gap-1 hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        {agency.website}
                      </a>
                    ) : (
                      <span className="text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{agency.city || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {agency.detected_stack && agency.detected_stack.length > 0 ? (
                        agency.detected_stack.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Link href={`/agencies/${agency.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(agency.id, agency.name)}
                        disabled={deletingId === agency.id}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
