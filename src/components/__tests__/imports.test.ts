/**
 * Import Test
 * Tests that all refactored components can be imported without errors
 */

describe('Component Imports', () => {
  it('can import TaskPanel without errors', () => {
    expect(() => {
      require('../TaskPanel');
    }).not.toThrow();
  });

  it('can import SubtaskSidebar without errors', () => {
    expect(() => {
      require('../SubtaskSidebar');
    }).not.toThrow();
  });

  it('can import WorkflowTab without errors', () => {
    expect(() => {
      require('../tabs/WorkflowTab');
    }).not.toThrow();
  });

  it('can import AgentTab without errors', () => {
    expect(() => {
      require('../tabs/AgentTab');
    }).not.toThrow();
  });

  it('can import LLMTab without errors', () => {
    expect(() => {
      require('../tabs/LLMTab');
    }).not.toThrow();
  });
});
