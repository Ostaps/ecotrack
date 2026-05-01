import { FileText, Download } from 'lucide-react';

export default function Compliance() {
  const handlePrint = () => {
    window.open('http://localhost:8080/api/v1/analytics/reports/esg', '_blank');
  };

  const handleDownload = (format) => {
    // In a real app this would trigger a download. Just alert for now.
    alert(`Downloading ESG Report as ${format}...`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance & Reporting</h1>
        <p className="text-gray-500">Generate certified carbon emissions reports for regulatory filing.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full">
        {/* Formal Report */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-green-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">ISO-14064 Statement</h3>
          </div>
          <p className="text-sm text-gray-500 mb-8 flex-1">
            Generate a formal, printable document summarizing verified emissions for the current period according to GLEC framework rules.
          </p>
          <button 
            onClick={handlePrint}
            className="w-full bg-[#22c55e] hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Generate Formal Report
          </button>
        </div>

        {/* Data Export */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Download className="text-gray-700" size={24} />
            <h3 className="text-lg font-bold text-gray-900">Raw Data Export</h3>
          </div>
          <p className="text-sm text-gray-500 mb-8 flex-1">
            Export GLEC Framework compliant data for ingestion into third-party auditing tools or internal data lakes.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleDownload('JSON')}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
            >
              Download JSON
            </button>
            <button 
              onClick={() => handleDownload('CSV')}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
