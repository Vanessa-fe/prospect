import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportWizard } from '@/components/import/import-wizard'
import { ExportSection } from '@/components/import/export-section'

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import / Export</h1>
        <p className="text-muted-foreground mt-2">
          Importez et exportez vos données au format CSV
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <ImportWizard />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
