import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const CSVTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Testing...');
  const [dataCount, setDataCount] = useState<number>(0);

  useEffect(() => {
    const testCSV = async () => {
      try {
        const response = await fetch('/chennai_crime_dataset.csv');
        if (!response.ok) {
          setTestResult(`Error: ${response.status} ${response.statusText}`);
          return;
        }

        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('CSV Test Results:', results);
            
            let validCount = 0;
            results.data.forEach((row: any, index: number) => {
              // Skip description row
              if (index === 0 && row.latitude && typeof row.latitude === 'string' && 
                  row.latitude.includes('chennai_crime_dataset')) {
                return;
              }

              const lat = parseFloat(row.latitude);
              const lng = parseFloat(row.longitude);
              
              if (!isNaN(lat) && !isNaN(lng) && 
                  lat >= -90 && lat <= 90 && 
                  lng >= -180 && lng <= 180) {
                validCount++;
              }
            });

            setDataCount(validCount);
            setTestResult(`✅ CSV loaded successfully! Found ${validCount} valid crime points.`);
          },
          error: (error) => {
            setTestResult(`❌ Parse error: ${error.message}`);
          }
        });

      } catch (err) {
        setTestResult(`❌ Fetch error: ${err}`);
      }
    };

    testCSV();
  }, []);

  return (
    <div className="p-4 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-2">CSV Test Results</h3>
      <p className="text-sm text-muted-foreground mb-2">{testResult}</p>
      <p className="text-sm text-muted-foreground">Valid data points: {dataCount}</p>
    </div>
  );
};

export default CSVTest;
