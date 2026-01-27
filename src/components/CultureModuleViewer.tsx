import { useState } from 'react';
import { cultureModules, CultureModule, getCultureModuleById } from '../data/cultureModules';
import './CultureModuleViewer.css';

interface CultureModuleViewerProps {
  onSelectScenario?: (scenarioId: string) => void;
}

export function CultureModuleViewer({ onSelectScenario }: CultureModuleViewerProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const selectedModule = selectedModuleId ? getCultureModuleById(selectedModuleId) : null;

  if (selectedModule) {
    return (
      <CultureModuleDetail
        module={selectedModule}
        onBack={() => setSelectedModuleId(null)}
        onSelectScenario={onSelectScenario}
      />
    );
  }

  return (
    <div className="culture-modules-list">
      <div className="culture-modules-header">
        <h2>Workplace Culture Guide</h2>
        <p>Understand the unwritten rules of Australian workplaces</p>
      </div>

      <div className="culture-modules-grid">
        {cultureModules.map(module => (
          <CultureModuleCard
            key={module.id}
            module={module}
            onClick={() => setSelectedModuleId(module.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface CultureModuleCardProps {
  module: CultureModule;
  onClick: () => void;
}

function CultureModuleCard({ module, onClick }: CultureModuleCardProps) {
  return (
    <button className="culture-module-card" onClick={onClick}>
      <span className="culture-module-icon">{module.icon}</span>
      <div className="culture-module-info">
        <h3>{module.title}</h3>
        <p>{module.shortDescription}</p>
        <span className="culture-module-time">{module.readingTimeMinutes} min read</span>
      </div>
    </button>
  );
}

interface CultureModuleDetailProps {
  module: CultureModule;
  onBack: () => void;
  onSelectScenario?: (scenarioId: string) => void;
}

function CultureModuleDetail({ module, onBack, onSelectScenario }: CultureModuleDetailProps) {
  return (
    <div className="culture-module-detail">
      <button className="culture-back-button" onClick={onBack}>
        ← Back to Culture Guide
      </button>

      <div className="culture-module-header">
        <span className="culture-detail-icon">{module.icon}</span>
        <h1>{module.title}</h1>
        <span className="culture-reading-time">{module.readingTimeMinutes} min read</span>
      </div>

      <div className="culture-module-content">
        {module.sections.map((section, index) => (
          <section key={index} className="culture-section">
            <h2>{section.heading}</h2>
            <p>{section.content}</p>

            {section.tip && (
              <div className="culture-tip">
                <span className="tip-label">Tip:</span> {section.tip}
              </div>
            )}

            {section.examples && section.examples.length > 0 && (
              <div className="culture-examples">
                <span className="examples-label">Examples:</span>
                <ul>
                  {section.examples.map((example, i) => (
                    <li key={i}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="culture-takeaways">
        <h2>Key Takeaways</h2>
        <ul>
          {module.keyTakeaways.map((takeaway, index) => (
            <li key={index}>{takeaway}</li>
          ))}
        </ul>
      </div>

      {module.relatedScenarios.length > 0 && onSelectScenario && (
        <div className="culture-related-scenarios">
          <h2>Practice These Scenarios</h2>
          <p>Put this knowledge into practice with related conversation scenarios:</p>
          <div className="related-scenario-buttons">
            {module.relatedScenarios.map(scenarioId => (
              <button
                key={scenarioId}
                className="related-scenario-btn"
                onClick={() => onSelectScenario(scenarioId)}
              >
                Practice: {formatScenarioId(scenarioId)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatScenarioId(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default CultureModuleViewer;
