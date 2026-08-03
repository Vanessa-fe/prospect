'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/lib/hooks/use-toast'
import { parseContactsCSV } from '@/lib/utils/csv/parser'
import { previewImport, bulkImportContacts } from '@/lib/actions/import'
import type { ImportPreview } from '@/types'
import { Upload, FileText, AlertCircle, CheckCircle, Users } from 'lucide-react'

type Step = 'upload' | 'preview' | 'importing' | 'complete'

export function ImportWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('upload')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [updateDuplicates, setUpdateDuplicates] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; updated: number } | null>(
    null
  )

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier CSV',
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await parseContactsCSV(selectedFile)

      if (result.errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Erreurs de parsing',
          description: result.errors[0],
        })
        setIsLoading(false)
        return
      }

      // Générer la preview
      const previewResult = await previewImport(result.data)

      if (!previewResult.success || !previewResult.data) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: previewResult.error || 'Erreur lors de l\'analyse',
        })
        setIsLoading(false)
        return
      }

      setPreview(previewResult.data)
      setStep('preview')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur lors de la lecture du fichier',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!preview || preview.validRows.length === 0) return

    setIsLoading(true)
    setStep('importing')

    const contactsToImport = [...preview.validRows]

    // Ajouter les doublons si l'utilisateur a choisi de les mettre à jour
    if (updateDuplicates) {
      contactsToImport.push(...preview.duplicates.map((d) => d.row))
    }

    const result = await bulkImportContacts(contactsToImport, { updateDuplicates })

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.error || 'Erreur lors de l\'import',
      })
      setStep('preview')
      setIsLoading(false)
      return
    }

    setImportResult(result.data ?? { imported: 0, updated: 0 })
    setStep('complete')
    setIsLoading(false)
    router.refresh()
  }

  const reset = () => {
    setStep('upload')
    setPreview(null)
    setUpdateDuplicates(false)
    setImportResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Étape 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Importer des contacts depuis un fichier CSV</CardTitle>
            <CardDescription>
              Sélectionnez un fichier CSV contenant vos contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Glissez-déposez votre fichier CSV ou cliquez pour sélectionner
                </p>
                <label htmlFor="csv-upload">
                  <Button variant="outline" disabled={isLoading} asChild>
                    <span>
                      <FileText className="w-4 h-4 mr-2" />
                      {isLoading ? 'Chargement...' : 'Choisir un fichier'}
                    </span>
                  </Button>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Le fichier CSV doit contenir au minimum un téléphone ou un email.
                Colonnes reconnues : Prénom, Nom, Téléphone, Email, Âge, Ville, Statut, Notes, Plateforme, etc.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Preview */}
      {step === 'preview' && preview && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de l&apos;import</CardTitle>
            <CardDescription>
              Vérifiez les données avant de les importer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Valides</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{preview.validRows.length}</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 mb-1">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Doublons</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">{preview.duplicates.length}</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-1">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Invalides</span>
                </div>
                <p className="text-2xl font-bold text-red-700">{preview.invalidRows.length}</p>
              </div>
            </div>

            {/* Doublons */}
            {preview.duplicates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="update-duplicates"
                    checked={updateDuplicates}
                    onCheckedChange={(checked) => setUpdateDuplicates(checked as boolean)}
                  />
                  <label htmlFor="update-duplicates" className="text-sm font-medium cursor-pointer">
                    Mettre à jour les {preview.duplicates.length} contact{preview.duplicates.length > 1 ? 's' : ''} en double avec les nouvelles données
                  </label>
                </div>
              </div>
            )}

            {/* Erreurs */}
            {preview.invalidRows.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {preview.invalidRows.length} ligne{preview.invalidRows.length > 1 ? 's' : ''} sera ignorée (données invalides)
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>
                Annuler
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || preview.validRows.length === 0}
              >
                <Users className="w-4 h-4 mr-2" />
                Importer {preview.validRows.length} contact{preview.validRows.length > 1 ? 's' : ''}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Import en cours */}
      {step === 'importing' && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-medium">Import en cours...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Veuillez patienter pendant l&apos;import des contacts
            </p>
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Terminé */}
      {step === 'complete' && importResult && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Import terminé !</h3>
            <p className="text-muted-foreground mb-6">
              {importResult.imported} contact{importResult.imported > 1 ? 's' : ''} importé{importResult.imported > 1 ? 's' : ''}
              {importResult.updated > 0 && `, ${importResult.updated} mis à jour`}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={reset}>
                Importer d&apos;autres contacts
              </Button>
              <Button onClick={() => router.push('/contacts')}>
                Voir mes contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
