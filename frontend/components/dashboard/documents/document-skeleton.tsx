import { Skeleton } from "@/components/ui/skeleton"

export function DocumentCardSkeleton() {
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {/* Preview Area */}
      <div className="aspect-5/4 bg-muted overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        
        {/* Date */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  )
}

export function DocumentsGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function DocumentsTableSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="w-10 h-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/6" />
          </div>
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      ))}
    </div>
  )
}
