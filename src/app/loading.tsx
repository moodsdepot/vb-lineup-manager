export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="bg-blue-950/70 backdrop-blur-lg border border-white/10 rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white/70 mt-4 font-satoshi">Loading LineupMan...</p>
        </div>
      </div>
    </div>
  );
} 