import { SessionRecord, ProgressStats, PracticeMode } from '../hooks/useProgressTracking';
import { UnlockedAchievement } from '../hooks/useAchievements';

interface ExportData {
  exportedAt: string;
  studentName: string;
  summary: {
    totalSessions: number;
    totalPracticeTime: string;
    averageSessionDuration: string;
    currentStreak: number;
    lastPracticeDate: string | null;
  };
  modeBreakdown: {
    everyday: number;
    slang: number;
    workplace: number;
  };
  achievements: {
    total: number;
    unlocked: number;
    list: Array<{
      id: string;
      unlockedAt: string;
    }>;
  };
  sessions: Array<{
    id: string;
    mode: PracticeMode;
    date: string;
    duration: string;
    messageCount: number;
    feedback: string;
  }>;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins} min ${secs} sec` : `${mins} minutes`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hours`;
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function formatFeedback(feedback: boolean | null): string {
  if (feedback === null) return 'No feedback';
  return feedback ? 'Positive' : 'Needs improvement';
}

export function exportToJSON(
  studentName: string,
  sessions: SessionRecord[],
  stats: ProgressStats,
  unlockedAchievements: UnlockedAchievement[],
  totalAchievements: number
): void {
  const exportData: ExportData = {
    exportedAt: new Date().toISOString(),
    studentName: studentName || 'Anonymous',
    summary: {
      totalSessions: stats.totalSessions,
      totalPracticeTime: formatDuration(stats.totalPracticeTime),
      averageSessionDuration: formatDuration(Math.round(stats.averageSessionDuration)),
      currentStreak: stats.streak,
      lastPracticeDate: stats.lastPracticeDate ? formatDate(stats.lastPracticeDate) : null,
    },
    modeBreakdown: stats.modeBreakdown,
    achievements: {
      total: totalAchievements,
      unlocked: unlockedAchievements.length,
      list: unlockedAchievements.map(a => ({
        id: a.id,
        unlockedAt: formatDate(a.unlockedAt),
      })),
    },
    sessions: sessions.map(s => ({
      id: s.id,
      mode: s.mode,
      date: formatDate(s.startTime),
      duration: formatDuration(s.duration),
      messageCount: s.messageCount,
      feedback: formatFeedback(s.feedback),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `speakaussie-progress-${Date.now()}.json`);
}

export function exportToCSV(
  studentName: string,
  sessions: SessionRecord[],
  stats: ProgressStats
): void {
  const headers = ['Session ID', 'Date', 'Mode', 'Duration (seconds)', 'Messages', 'Feedback'];

  const rows = sessions.map(s => [
    s.id,
    s.startTime.toISOString(),
    s.mode,
    s.duration.toString(),
    s.messageCount.toString(),
    formatFeedback(s.feedback),
  ]);

  // Add summary rows at the end
  const summaryRows = [
    [],
    ['SUMMARY'],
    ['Student Name', studentName || 'Anonymous'],
    ['Total Sessions', stats.totalSessions.toString()],
    ['Total Practice Time', formatDuration(stats.totalPracticeTime)],
    ['Current Streak', `${stats.streak} days`],
    ['Everyday Sessions', stats.modeBreakdown.everyday.toString()],
    ['Slang Sessions', stats.modeBreakdown.slang.toString()],
    ['Workplace Sessions', stats.modeBreakdown.workplace.toString()],
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ...summaryRows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `speakaussie-progress-${Date.now()}.csv`);
}

export function exportToPDF(
  studentName: string,
  sessions: SessionRecord[],
  stats: ProgressStats,
  unlockedAchievements: UnlockedAchievement[],
  totalAchievements: number
): void {
  // Generate HTML content for PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SpeakAussie - Progress Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1a1a2e;
    }
    h1 { color: #00843D; border-bottom: 2px solid #00843D; padding-bottom: 10px; }
    h2 { color: #00843D; margin-top: 30px; }
    .header { text-align: center; margin-bottom: 40px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .stat-box { background: #f8fafc; padding: 20px; border-radius: 8px; }
    .stat-value { font-size: 2rem; font-weight: bold; color: #00843D; }
    .stat-label { color: #6b7280; font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background-color: #f8fafc; font-weight: 600; }
    .mode-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      background-color: #e0f2fe;
    }
    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 0.8rem; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>SpeakAussie</h1>
    <p>Progress Report for <strong>${studentName || 'Student'}</strong></p>
    <p style="color: #6b7280;">Generated on ${new Date().toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</p>
  </div>

  <h2>Summary</h2>
  <div class="stat-grid">
    <div class="stat-box">
      <div class="stat-value">${stats.totalSessions}</div>
      <div class="stat-label">Total Sessions</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${formatDuration(stats.totalPracticeTime)}</div>
      <div class="stat-label">Practice Time</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${stats.streak} days</div>
      <div class="stat-label">Current Streak</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${unlockedAchievements.length}/${totalAchievements}</div>
      <div class="stat-label">Achievements</div>
    </div>
  </div>

  <h2>Practice Mode Breakdown</h2>
  <table>
    <tr>
      <th>Mode</th>
      <th>Sessions</th>
      <th>Percentage</th>
    </tr>
    <tr>
      <td>Everyday English</td>
      <td>${stats.modeBreakdown.everyday}</td>
      <td>${stats.totalSessions > 0 ? Math.round((stats.modeBreakdown.everyday / stats.totalSessions) * 100) : 0}%</td>
    </tr>
    <tr>
      <td>Aussie Slang</td>
      <td>${stats.modeBreakdown.slang}</td>
      <td>${stats.totalSessions > 0 ? Math.round((stats.modeBreakdown.slang / stats.totalSessions) * 100) : 0}%</td>
    </tr>
    <tr>
      <td>Workplace English</td>
      <td>${stats.modeBreakdown.workplace}</td>
      <td>${stats.totalSessions > 0 ? Math.round((stats.modeBreakdown.workplace / stats.totalSessions) * 100) : 0}%</td>
    </tr>
  </table>

  <h2>Recent Sessions</h2>
  <table>
    <tr>
      <th>Date</th>
      <th>Mode</th>
      <th>Duration</th>
      <th>Messages</th>
    </tr>
    ${sessions.slice(-10).reverse().map(s => `
    <tr>
      <td>${s.startTime.toLocaleDateString('en-AU')}</td>
      <td><span class="mode-badge">${s.mode}</span></td>
      <td>${formatDuration(s.duration)}</td>
      <td>${s.messageCount}</td>
    </tr>
    `).join('')}
  </table>

  <div class="footer">
    <p>Keep up the great work! Regular practice is the key to mastering Aussie English.</p>
  </div>
</body>
</html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
