import { Loader2 } from 'lucide-react';

const ExportLoader = ({ isExporting }) => {
  if (!isExporting) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center cursor-wait">
      <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
      <h2 className="text-xl font-bold text-white tracking-wider">EXPORTING IMAGE...</h2>
    </div>
  );
};

export default ExportLoader;