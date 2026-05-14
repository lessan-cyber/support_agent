/**
 * EXEMPLE: Comment utiliser les Suspense de Next.js avec ton DocumentsPage
 * 
 * Cela demande une refactorisation pour utiliser les React Server Components (RSCs)
 * et déplacer le fetch côté serveur.
 */

// ============================================================================
// OPTION 1: Avec async/await côté serveur (RECOMMANDÉ)
// ============================================================================
// app/dashboard/documents/page.tsx (RSC)
/*
import { Suspense } from "react"
import { DocumentsContent } from "./documents-content"
import { DocumentsGridSkeleton, DocumentsTableSkeleton } from "@/components/dashboard/documents/document-skeleton"

export default function DocumentsPage() {
  return (
    <div className="flex flex-col h-full space-y-6 m-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Documents</h1>
        {/* ... Upload Dialog ... */}
      </div>

      {/* Filters */}
      {/* ... Filters & Search ... */}

      {/* Content avec Suspense */}
      <div className="flex-1">
        <Suspense fallback={<DocumentsGridSkeleton count={2} />}>
          <DocumentsContent />
        </Suspense>
      </div>
    </div>
  )
}
*/

// ============================================================================
// documents-content.tsx (RSC - côté serveur)
// ============================================================================
/*
import { getAllDocuments } from "@/app/actions/upload_document"
import { DocumentCard } from "@/components/dashboard/documents/document-card"
import { DocumentsEmptyState } from "@/components/dashboard/documents/documents-empty-state"

export async function DocumentsContent() {
  // Fetch côté serveur - pas d'état, pas d'useEffect
  const response = await getAllDocuments()

  if (!response.documents || response.documents.length === 0) {
    return <DocumentsEmptyState onUploadClick={() => {}} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {response.documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRename={handleRename}
          onShare={handleShare}
          onPreview={handlePreview}
        />
      ))}
    </div>
  )
}
*/

// ============================================================================
// OPTION 2: Avec Suspense et streaming (pour pagination)
// ============================================================================
/*
export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentPage, setCurrentPage] = useState(1)

  return (
    <div className="flex flex-col h-full space-y-6 m-4">
      {/* ... Header & Filters ... */}
      
      <div className="flex-1">
        <Suspense 
          key={currentPage} // Force re-fetch quand la page change
          fallback={
            viewMode === "grid" 
              ? <DocumentsGridSkeleton count={2} />
              : <DocumentsTableSkeleton count={2} />
          }
        >
          <DocumentsContent page={currentPage} />
        </Suspense>
      </div>
    </div>
  )
}
*/

// ============================================================================
// AVANTAGES DE CETTE APPROCHE
// ============================================================================
/*
✅ Pas d'état de loading compliqué
✅ Skeleton magnifique pendant le fetch
✅ Meilleure performance (fetch côté serveur)
✅ Comportement prévisible
✅ SEO amélioré

INCONVÉNIENTS
❌ Moins de contrôle sur le timing du fetch
❌ Pas de recherche en temps réel (sauf avec client components)
❌ Plus complexe pour la pagination interactive
*/
