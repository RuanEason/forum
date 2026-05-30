export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 py-6 px-0">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border-b sm:border-0 border-gray-100">
          <div className="p-4 sm:p-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-3 w-36 rounded bg-gray-100" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="h-7 w-4/5 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-[96%] rounded bg-gray-100" />
              <div className="h-4 w-[88%] rounded bg-gray-100" />
            </div>

            <div className="mt-5 h-56 w-full rounded-xl bg-gray-100" />

            <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-4">
              <div className="h-8 w-16 rounded-full bg-gray-100" />
              <div className="h-8 w-16 rounded-full bg-gray-100" />
              <div className="h-8 w-16 rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
