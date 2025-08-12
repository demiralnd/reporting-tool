import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, X, Plus, GripVertical } from 'lucide-react';

interface CustomMetric {
  name: string;
  keywords: string[];
  operator: 'AND' | 'OR';
}

interface MetricsAutocompleteProps {
  allMetrics: string[];
  selectedMetrics: string[];
  onToggleMetric: (metric: string) => void;
  onReorderMetrics?: (reorderedMetrics: string[]) => void;
  onAddCustomMetric?: (metric: CustomMetric) => void;
  placeholder?: string;
}

const MetricsAutocomplete: React.FC<MetricsAutocompleteProps> = ({
  allMetrics,
  selectedMetrics,
  onToggleMetric,
  onReorderMetrics,
  onAddCustomMetric
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showCustomMetricModal, setShowCustomMetricModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [customMetricName, setCustomMetricName] = useState('');
  const [customMetricKeywords, setCustomMetricKeywords] = useState('');
  const [customMetricOperator, setCustomMetricOperator] = useState<'AND' | 'OR'>('OR');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter metrics based on search term
  const filteredMetrics = searchTerm.length > 0 
    ? allMetrics.filter(metric =>
        metric.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10) // Limit to 10 results when searching
    : allMetrics; // Show all metrics when no search term

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setFocusedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setFocusedIndex(prev => 
          prev < filteredMetrics.length - 1 ? prev + 1 : 0
        );
        e.preventDefault();
        break;
      case 'ArrowUp':
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredMetrics.length - 1
        );
        e.preventDefault();
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex < filteredMetrics.length) {
          onToggleMetric(filteredMetrics[focusedIndex]);
          setSearchTerm('');
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        setSearchTerm('');
        searchInputRef.current?.blur();
        e.preventDefault();
        break;
    }
  };

  const handleMetricClick = (metric: string) => {
    onToggleMetric(metric);
    // Keep dropdown open and don't clear search
    // setSearchTerm('');
    // setIsOpen(false);
    // setFocusedIndex(-1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
    searchInputRef.current?.focus();
  };

  // Handle drag and drop for selected metrics reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reorderedMetrics = [...selectedMetrics];
    const draggedMetric = reorderedMetrics[draggedIndex];
    reorderedMetrics.splice(draggedIndex, 1);
    reorderedMetrics.splice(dropIndex, 0, draggedMetric);

    if (onReorderMetrics) {
      onReorderMetrics(reorderedMetrics);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Handle custom metric creation
  const handleCreateCustomMetric = () => {
    if (!customMetricName.trim() || !customMetricKeywords.trim()) return;

    const keywords = customMetricKeywords
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);

    if (keywords.length === 0) return;

    const customMetric: CustomMetric = {
      name: customMetricName.trim(),
      keywords,
      operator: customMetricOperator
    };

    if (onAddCustomMetric) {
      onAddCustomMetric(customMetric);
    }

    // Reset form
    setCustomMetricName('');
    setCustomMetricKeywords('');
    setCustomMetricOperator('OR');
    setShowCustomMetricModal(false);
  };

  const resetCustomMetricForm = () => {
    setCustomMetricName('');
    setCustomMetricKeywords('');
    setCustomMetricOperator('OR');
    setShowCustomMetricModal(false);
  };

  return (
    <>
      <div ref={containerRef} className="relative w-64">
        {/* Metrics Button to Open Panel */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-xs font-dm-sans hover:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all duration-200 flex items-center justify-between"
          >
            <span className="text-gray-700">
              {selectedMetrics.length > 0 ? `${selectedMetrics.length} metrics selected` : 'Select metrics...'}
            </span>
            <Search className="w-3 h-3 text-gray-400" />
          </button>
        )}

      {/* Metrics Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] p-3">
          {/* Header with Search */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-700">
              Metrics ({selectedMetrics.length} selected)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCustomMetricModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Custom
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search metrics..."
              className="w-full pl-7 pr-8 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-dm-sans text-xs"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Unified Metrics List */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">
              All Metrics ({selectedMetrics.length} selected)
            </div>
            <div className="max-h-60 overflow-y-auto border rounded p-1 bg-gray-50">
              {/* Selected Metrics Section - Draggable */}
              {selectedMetrics.length > 0 && (
                <div className="mb-2">
                  <div className="space-y-1">
                    {selectedMetrics.map((metric, index) => (
                      <div
                        key={`selected-${metric}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between p-2 bg-white rounded border text-xs cursor-move hover:bg-gray-50 transition-colors ${
                          draggedIndex === index ? 'opacity-50' : ''
                        } border-red-200 bg-red-50`}
                      >
                        <div className="flex items-center flex-1">
                          <GripVertical className="w-3 h-3 text-red-400 mr-2 flex-shrink-0" />
                          <span className="text-red-900 font-medium truncate">{metric}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <button
                            onClick={() => onToggleMetric(metric)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Available Metrics Section */}
              <div>
                {selectedMetrics.length > 0 && (
                  <div className="text-xs text-gray-600 mb-1 px-2 font-medium">Available:</div>
                )}
                {filteredMetrics.length > 0 ? (
                  filteredMetrics
                    .filter(metric => !selectedMetrics.includes(metric))
                    .map((metric, index) => {
                      const isFocused = index === focusedIndex;
                      
                      return (
                        <div
                          key={`available-${metric}`}
                          onClick={() => handleMetricClick(metric)}
                          className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-150 rounded bg-white mb-1 ${
                            isFocused 
                              ? 'bg-red-50 border-l-2 border-red-500' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xs font-dm-sans text-gray-700">
                            {metric}
                          </span>
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full hover:border-red-400 transition-colors" />
                        </div>
                      );
                    })
                ) : (
                  !selectedMetrics.length && (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm font-dm-sans">
                      No metrics found for "{searchTerm}"
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Custom Metric Creation Modal */}
      {showCustomMetricModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[10000] backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 w-96 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 font-dm-sans">
              Add Custom Metric
            </h3>
            
            <div className="space-y-4">
              {/* Metric Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-dm-sans">
                  Metric Name
                </label>
                <input
                  type="text"
                  value={customMetricName}
                  onChange={(e) => setCustomMetricName(e.target.value)}
                  placeholder="e.g., Custom Engagement Rate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-dm-sans text-sm"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-dm-sans">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={customMetricKeywords}
                  onChange={(e) => setCustomMetricKeywords(e.target.value)}
                  placeholder="e.g., engagement, rate, interaction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-dm-sans text-sm"
                />
                <p className="text-xs text-gray-500 mt-1 font-dm-sans">
                  Enter keywords separated by commas to define when this metric should be suggested
                </p>
              </div>

              {/* Operator */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-dm-sans">
                  Match Operator
                </label>
                <div className="flex space-x-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="OR"
                      checked={customMetricOperator === 'OR'}
                      onChange={(e) => setCustomMetricOperator(e.target.value as 'OR')}
                      className="mr-2 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm font-dm-sans">OR</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="AND"
                      checked={customMetricOperator === 'AND'}
                      onChange={(e) => setCustomMetricOperator(e.target.value as 'AND')}
                      className="mr-2 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-sm font-dm-sans">AND</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-dm-sans">
                  OR: Match any keyword | AND: Match all keywords
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetCustomMetricForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-dm-sans"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomMetric}
                disabled={!customMetricName.trim() || !customMetricKeywords.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm font-dm-sans"
              >
                Add Metric
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MetricsAutocomplete;