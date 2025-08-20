import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { runAnalysis } from '@/lib/runAnalysis';

const TestAnalysis = () => {
  const [results, setResults] = useState<any>(null);

  const de = `
AUFGABEN:
- Erstellung monatlicher KPI-Reports in Excel und Looker Studio
- Pflege des CRM und Bereinigung von CSV-Importen
- Terminabstimmung mit Partnern und Versand von Einladungen per E-Mail
- Durchführung von Kundenworkshops und Beratung zu Anforderungen

ANFORDERUNGEN:
- Erfahrung mit SQL und API-Integrationen
`;

  const en = `
RESPONSIBILITIES:
* Build and maintain CI/CD pipelines for microservices
* Create dashboards and alerts for key metrics
* Coordinate stakeholder meetings and send follow-ups
* Lead discovery workshops with clients

QUALIFICATIONS:
- Experience with Terraform, Kubernetes, and REST APIs
`;

  const runTests = () => {

    
    const deResult = runAnalysis(de);
    const enResult = runAnalysis(en);
    
    
    
    setResults({
      german: deResult,
      english: enResult
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Analysis Function Test</h2>
        <Button onClick={runTests} size="lg">
          Run Analysis Tests
        </Button>
      </div>

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* German Results */}
          <Card>
            <CardHeader>
              <CardTitle>German Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Total Score:</strong> {results.german.totalScore}%
              </div>
              <div>
                <strong>Tasks Found:</strong> {results.german.tasks.length}
              </div>
              <div>
                <strong>Ratio:</strong> {results.german.ratio.automatisierbar}% automatable, {results.german.ratio.mensch}% human
              </div>
              <div>
                <strong>Summary:</strong> {results.german.summary}
              </div>
              
              <div>
                <strong>Tasks:</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  {results.german.tasks.map((task: any, i: number) => (
                    <li key={i} className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.label === 'Automatisierbar' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {task.label}
                      </span>
                      <span className="ml-2">{task.text.substring(0, 60)}...</span>
                      <span className="ml-2 text-gray-500">(Score: {task.score})</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <strong>Recommendations:</strong>
                <ul className="list-disc pl-6 mt-2">
                  {results.german.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* English Results */}
          <Card>
            <CardHeader>
              <CardTitle>English Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Total Score:</strong> {results.english.totalScore}%
              </div>
              <div>
                <strong>Tasks Found:</strong> {results.english.tasks.length}
              </div>
              <div>
                <strong>Ratio:</strong> {results.english.ratio.automatisierbar}% automatable, {results.english.ratio.mensch}% human
              </div>
              <div>
                <strong>Summary:</strong> {results.english.summary}
              </div>
              
              <div>
                <strong>Tasks:</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  {results.english.tasks.map((task: any, i: number) => (
                    <li key={i} className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.label === 'Automatisierbar' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {task.label}
                      </span>
                      <span className="ml-2">{task.text.substring(0, 60)}...</span>
                      <span className="ml-2 text-gray-500">(Score: {task.score})</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <strong>Recommendations:</strong>
                <ul className="list-disc pl-6 mt-2">
                  {results.english.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">German Sample:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">{de}</pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">English Sample:</h4>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">{en}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAnalysis;