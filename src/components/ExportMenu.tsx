import { useState } from 'react';
import { SessionRecord, ProgressStats } from '../hooks/useProgressTracking';
import { UnlockedAchievement } from '../hooks/useAchievements';
import { exportToJSON, exportToCSV, exportToPDF } from '../utils/exportProgress';
import './ExportMenu.css';

interface ExportMenuProps {
  studentName: string;
  sessions: SessionRecord[];
  stats: ProgressStats;
  unlockedAchievements: UnlockedAchievement[];
  totalAchievements: number;
}

export function ExportMenu({
  studentName,
  sessions,
  stats,
  unlockedAchievements,
  totalAchievements,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportJSON = () => {
    exportToJSON(studentName, sessions, stats, unlockedAchievements, totalAchievements);
    setIsOpen(false);
  };

  const handleExportCSV = () => {
    exportToCSV(studentName, sessions, stats);
    setIsOpen(false);
  };

  const handleExportPDF = () => {
    exportToPDF(studentName, sessions, stats, unlockedAchievements, totalAchievements);
    setIsOpen(false);
  };

  return (
    <div className="export-menu-container">
      <button
        className="export-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={sessions.length === 0}
      >
        Export Progress
      </button>

      {isOpen && (
        <>
          <div className="export-backdrop" onClick={() => setIsOpen(false)} />
          <div className="export-dropdown">
            <button className="export-option" onClick={handleExportJSON}>
              <span className="export-icon">📄</span>
              <div className="export-option-info">
                <span className="export-option-title">Export as JSON</span>
                <span className="export-option-desc">Complete data for backup or import</span>
              </div>
            </button>
            <button className="export-option" onClick={handleExportCSV}>
              <span className="export-icon">📊</span>
              <div className="export-option-info">
                <span className="export-option-title">Export as CSV</span>
                <span className="export-option-desc">Open in Excel or Google Sheets</span>
              </div>
            </button>
            <button className="export-option" onClick={handleExportPDF}>
              <span className="export-icon">🖨️</span>
              <div className="export-option-info">
                <span className="export-option-title">Print Report</span>
                <span className="export-option-desc">Generate printable progress report</span>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
