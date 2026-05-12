const ArticleSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="bg-gray-200 rounded-lg h-48 w-full" />
    <div className="space-y-2 p-2">
      <div className="h-3 bg-gray-200 rounded w-20" />
      <div className="h-5 bg-gray-200 rounded w-full" />
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-24 mt-2" />
    </div>
  </div>
);

export const ArticleGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <ArticleSkeleton key={i} />
    ))}
  </div>
);

export const ArticleDetailSkeleton = () => (
  <div className="animate-pulse max-w-4xl mx-auto px-4 py-12 space-y-6">
    <div className="flex justify-center gap-2">
      <div className="h-6 bg-gray-200 rounded w-20" />
      <div className="h-6 bg-gray-200 rounded w-24" />
    </div>
    <div className="h-10 bg-gray-200 rounded w-full" />
    <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto" />
    <div className="h-4 bg-gray-200 rounded w-40 mx-auto" />
    <div className="h-96 bg-gray-200 rounded-lg w-full" />
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
      ))}
    </div>
  </div>
);

export default ArticleSkeleton;
