'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/use-toast'
import {
  exportContactsToCSV,
  exportAppointmentsToCSV,
  exportPaymentsToCSV,
  downloadCSV,
} from '@/lib/utils/csv/exporter'
import { generateContactsTemplate } from '@/lib/utils/csv/parser'
import { Download, FileDown, Users, Calendar, DollarSign } from 'lucide-react'

export function ExportSection() {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const handleExportContacts = async () => {
    setIsExporting('contacts')
    try {
      const response = await fetch('/api/export/contacts')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'export')
      }

      const csv = exportContactsToCSV(data.contacts)
      const filename = `contacts-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csv, filename)

      toast({
        title: 'Succès',
        description: `${data.contacts.length} contacts exportés`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'export',
      })
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportAppointments = async () => {
    setIsExporting('appointments')
    try {
      const response = await fetch('/api/export/appointments')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'export')
      }

      const csv = exportAppointmentsToCSV(data.appointments)
      const filename = `rendez-vous-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csv, filename)

      toast({
        title: 'Succès',
        description: `${data.appointments.length} rendez-vous exportés`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'export',
      })
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportPayments = async () => {
    setIsExporting('payments')
    try {
      const response = await fetch('/api/export/payments')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'export')
      }

      const csv = exportPaymentsToCSV(data.payments)
      const filename = `paiements-${new Date().toISOString().split('T')[0]}.csv`
      downloadCSV(csv, filename)

      toast({
        title: 'Succès',
        description: `${data.payments.length} paiements exportés`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'export',
      })
    } finally {
      setIsExporting(null)
    }
  }

  const handleDownloadTemplate = () => {
    const csv = generateContactsTemplate()
    downloadCSV(csv, 'template-contacts.csv')

    toast({
      title: 'Succès',
      description: 'Template téléchargé',
    })
  }

  return (
    <div className="space-y-6">
      {/* Template */}
      <Card>
        <CardHeader>
          <CardTitle>Template CSV</CardTitle>
          <CardDescription>
            Téléchargez un fichier exemple pour l&apos;import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadTemplate} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Télécharger le template
          </Button>
        </CardContent>
      </Card>

      {/* Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Exporter vos données</CardTitle>
          <CardDescription>
            Téléchargez vos données au format CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contacts */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Contacts</h3>
                  <p className="text-sm text-muted-foreground">
                    Tous vos contacts
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportContacts}
                disabled={isExporting === 'contacts'}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting === 'contacts' ? 'Export...' : 'Exporter'}
              </Button>
            </div>

            {/* Rendez-vous */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Rendez-vous</h3>
                  <p className="text-sm text-muted-foreground">
                    Tous vos RDV
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportAppointments}
                disabled={isExporting === 'appointments'}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting === 'appointments' ? 'Export...' : 'Exporter'}
              </Button>
            </div>

            {/* Paiements */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Paiements</h3>
                  <p className="text-sm text-muted-foreground">
                    Tous vos paiements
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportPayments}
                disabled={isExporting === 'payments'}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting === 'payments' ? 'Export...' : 'Exporter'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
