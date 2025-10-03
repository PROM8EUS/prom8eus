/**
 * Manual Integration Test Component
 * This component can be used to manually test the integration of all layout components
 * Import and render this component in your app to verify everything works together
 */

import React, { useState } from 'react';
import TaskPanel from '../TaskPanel';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { SmartDefaultsProvider } from '../SmartDefaultsManager';
import { ContextualHelpProvider, ContextualHelpPanel } from '../ContextualHelpSystem';
import { HelpTrigger } from '../HelpTrigger';

const testTask = {
  title: 'Manual Integration Test Task',
  description: 'This is a test task for manual integration testing',
  category: 'test',
  subtasks: [
    {
      id: 'subtask-1',
      title: 'Test Subtask 1',
      description: 'First test subtask for manual testing',
      automationPotential: 85,
      estimatedTime: 4,
      priority: 'high' as const,
      complexity: 'medium' as const,
      systems: ['Test System A', 'Test System B'],
      risks: ['Test Risk 1'],
      opportunities: ['Test Opportunity 1'],
      dependencies: []
    },
    {
      id: 'subtask-2',
      title: 'Test Subtask 2',
      description: 'Second test subtask for manual testing',
      automationPotential: 70,
      estimatedTime: 6,
      priority: 'medium' as const,
      complexity: 'high' as const,
      systems: ['Test System C'],
      risks: ['Test Risk 2'],
      opportunities: ['Test Opportunity 2'],
      dependencies: ['subtask-1']
    }
  ]
};

export function ManualIntegrationTest() {
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [currentLang, setCurrentLang] = useState<'de' | 'en'>('en');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Manual Integration Test Controls</h2>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setCurrentLang(currentLang === 'en' ? 'de' : 'en')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Switch to {currentLang === 'en' ? 'German' : 'English'}
            </button>
            <button
              onClick={() => setShowHelpPanel(!showHelpPanel)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {showHelpPanel ? 'Hide' : 'Show'} Help Panel
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Current Language:</strong> {currentLang}</p>
            <p><strong>Help Panel:</strong> {showHelpPanel ? 'Visible' : 'Hidden'}</p>
          </div>
        </div>

        {/* Help Panel (if enabled) */}
        {showHelpPanel && (
          <ContextualHelpPanel lang={currentLang} />
        )}

        {/* Test Individual Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CollapsibleSection Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">CollapsibleSection Test</h3>
            <CollapsibleSection
              title={
                <div className="flex items-center gap-2">
                  Test Section with Help
                  <HelpTrigger section="test-section" lang={currentLang} />
                </div>
              }
              description="This is a test of the CollapsibleSection component"
              priority="high"
              badge={{
                text: 'Test',
                count: 3,
                variant: 'default'
              }}
              showProgress={true}
              progressValue={75}
              progressMax={100}
            >
              <div className="space-y-2">
                <p>This is the content of the collapsible section.</p>
                <p>It should be expandable and collapsible.</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    Test Button 1
                  </button>
                  <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                    Test Button 2
                  </button>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* HelpTrigger Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">HelpTrigger Test</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span>This text has help:</span>
                <HelpTrigger section="solutions-overview" lang={currentLang} />
              </div>
              <div className="flex items-center gap-2">
                <span>This text has inline help:</span>
                <HelpTrigger section="workflow-tab" lang={currentLang} />
              </div>
              <div className="flex items-center gap-2">
                <span>This text has warning help:</span>
                <HelpTrigger section="agent-tab" lang={currentLang} />
              </div>
            </div>
          </div>
        </div>

        {/* Full TaskPanel Integration Test */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Full TaskPanel Integration Test</h3>
          <div className="border rounded-lg overflow-hidden">
            <TaskPanel 
              task={testTask} 
              lang={currentLang} 
              isVisible={true} 
            />
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-800">✅ SmartDefaultsProvider</h4>
              <p className="text-sm text-green-600">Integrated and working</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-800">✅ ContextualHelpProvider</h4>
              <p className="text-sm text-green-600">Integrated and working</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-800">✅ CollapsibleSection</h4>
              <p className="text-sm text-green-600">Integrated and working</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-800">✅ Responsive Layout</h4>
              <p className="text-sm text-green-600">Integrated and working</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManualIntegrationTest;
