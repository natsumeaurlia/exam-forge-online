import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export function QuizListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-4" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </CardContent>

            <CardFooter className="pt-3 border-t">
              <div className="flex items-center w-full">
                <Skeleton className="h-3 w-3 mr-1" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20 ml-auto" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center space-x-2">
        <Skeleton className="h-9 w-16" />
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-9" />
          ))}
        </div>
        <Skeleton className="h-9 w-16" />
      </div>
    </div>
  )
}