import React, { useState } from 'react';
import { Check, X, Plus, Trash2, Search } from 'lucide-react';

interface CampaignData {
  campaignName: string;
  data: { [key: string]: string };
}

interface Cluster {
  id: string;
  name: string;
  campaigns: string[];
}

interface MetricMapping {
  [uploadedMetric: string]: string; // maps uploaded metric name to selected target metric name
}

interface CampaignSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignData: CampaignData[];
  onConfirm: (selectedCampaigns: string[], clusters?: Cluster[], metricMapping?: MetricMapping) => void;
  isUpdateMode?: boolean;
  existingCampaigns?: string[];
  availableMetrics?: string[]; // Available metrics in the target spreadsheet
}

const CampaignSelectionModal: React.FC<CampaignSelectionModalProps> = ({
  isOpen,
  onClose,
  campaignData,
  onConfirm,
  isUpdateMode = false,
  existingCampaigns = [],
  availableMetrics = []
}) => {
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [newClusterName, setNewClusterName] = useState('');
  const [showClustering, setShowClustering] = useState(false);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [metricMapping, setMetricMapping] = useState<MetricMapping>({});
  const [showMetricMapping, setShowMetricMapping] = useState(false);
  const [newMetricName, setNewMetricName] = useState('');

  if (!isOpen) return null;

  // Filter campaigns based on search term
  const filteredCampaignData = campaignData.filter(campaign =>
    campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to check if a campaign exists in the spreadsheet
  const isExistingCampaign = (campaignName: string) => {
    return existingCampaigns.includes(campaignName);
  };

  // Get all unique metrics from uploaded campaign data
  const getUploadedMetrics = () => {
    const allMetrics = new Set<string>();
    campaignData.forEach(campaign => {
      Object.keys(campaign.data).forEach(metric => {
        allMetrics.add(metric);
      });
    });
    return Array.from(allMetrics);
  };

  // Analyze metric matching with detailed opportunities
  const analyzeMetrics = () => {
    const uploadedMetrics = getUploadedMetrics();
    const exactMatches = uploadedMetrics.filter(metric => availableMetrics.includes(metric));
    const unmatchedMetrics = uploadedMetrics.filter(metric => !availableMetrics.includes(metric));
    
    // Find potential matches for unmatched metrics
    const potentialMatches = unmatchedMetrics.map(uploadedMetric => {
      const uploadedLower = uploadedMetric.toLowerCase();
      
      // Find similar metrics in available metrics
      const similarMetrics = availableMetrics.filter(targetMetric => {
        const targetLower = targetMetric.toLowerCase();
        return targetLower.includes(uploadedLower) || 
               uploadedLower.includes(targetLower) ||
               calculateSimilarity(uploadedLower, targetLower) > 0.6;
      });
      
      // Check common aliases
      const aliases = {
        'cost': ['amount spent', 'spend'],
        'spend': ['amount spent', 'cost'],
        'amount spent': ['cost', 'spend'],
        'impr.': ['impressions'],
        'impressions': ['impr.'],
        'link clicks': ['clicks'],
        'clicks': ['link clicks'],
        'ctr': ['click-through rate', 'clickthrough rate'],
        'cpc': ['cost per click'],
        'cpm': ['cost per mille', 'cost per thousand']
      };
      
      const possibleAliases = aliases[uploadedLower] || [];
      const aliasMatches = availableMetrics.filter(targetMetric => 
        possibleAliases.some(alias => targetMetric.toLowerCase().includes(alias))
      );
      
      return {
        uploadedMetric,
        similarMetrics: [...new Set([...similarMetrics, ...aliasMatches])],
        confidence: similarMetrics.length > 0 ? 'high' : aliasMatches.length > 0 ? 'medium' : 'low'
      };
    });
    
    return {
      uploadedMetrics,
      exactMatches,
      unmatchedMetrics,
      potentialMatches
    };
  };
  
  // Calculate string similarity (Levenshtein distance based)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
  };

  const { exactMatches, unmatchedMetrics, potentialMatches } = analyzeMetrics();

  const handleToggleCampaign = (campaignName: string) => {
    setSelectedCampaigns(prev => {
      const isCurrentlySelected = prev.includes(campaignName);
      
      if (isCurrentlySelected) {
        // Remove from selected campaigns and from any cluster
        setClusters(clusters.map(cluster => ({
          ...cluster,
          campaigns: cluster.campaigns.filter(c => c !== campaignName)
        })));
        return prev.filter(name => name !== campaignName);
      } else {
        // Add to selected campaigns
        const newSelected = [...prev, campaignName];
        
        // If there's an active cluster, add to that cluster
        if (activeCluster) {
          setClusters(clusters.map(cluster => {
            if (cluster.id === activeCluster) {
              return {
                ...cluster,
                campaigns: [...cluster.campaigns.filter(c => c !== campaignName), campaignName]
              };
            } else {
              // Remove from other clusters
              return {
                ...cluster,
                campaigns: cluster.campaigns.filter(c => c !== campaignName)
              };
            }
          }));
        }
        
        return newSelected;
      }
    });
  };

  const handleCreateCluster = () => {
    if (newClusterName.trim()) {
      const newCluster: Cluster = {
        id: Date.now().toString(),
        name: newClusterName.trim(),
        campaigns: []
      };
      setClusters([...clusters, newCluster]);
      setNewClusterName('');
    }
  };

  const handleDeleteCluster = (clusterId: string) => {
    setClusters(clusters.filter(c => c.id !== clusterId));
    // If we're deleting the active cluster, clear active cluster
    if (activeCluster === clusterId) {
      setActiveCluster(null);
    }
  };


  const getCampaignCluster = (campaignName: string) => {
    return clusters.find(cluster => cluster.campaigns.includes(campaignName));
  };

  const handleConfirm = () => {
    // Ensure we pass the metric mapping to the parent
    console.log('🎯 Confirming with metric mapping:', metricMapping);
    console.log('🎯 Selected campaigns:', selectedCampaigns);
    console.log('🎯 Clusters:', clusters);
    
    onConfirm(
      selectedCampaigns, 
      clusters.length > 0 ? clusters : undefined, 
      Object.keys(metricMapping).length > 0 ? metricMapping : undefined
    );
    
    // Reset state
    setSelectedCampaigns([]);
    setClusters([]);
    setShowClustering(false);
    setActiveCluster(null);
    setSearchTerm('');
    setMetricMapping({});
    setShowMetricMapping(false);
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setMetricMapping({});
    setShowMetricMapping(false);
  };

  const handleSelectAll = () => {
    // Add all filtered campaigns to selection (preserving existing selections)
    const filteredCampaignNames = filteredCampaignData.map(c => c.campaignName);
    setSelectedCampaigns(prev => [...new Set([...prev, ...filteredCampaignNames])]);
  };

  const handleDeselectAll = () => {
    // Remove all filtered campaigns from selection
    const filteredCampaignNames = filteredCampaignData.map(c => c.campaignName);
    setSelectedCampaigns(prev => prev.filter(name => !filteredCampaignNames.includes(name)));
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 w-[900px] max-w-[90vw] max-h-[85vh] shadow-2xl border border-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-dm-sans">
            {isUpdateMode ? 'Select Campaigns to Update' : 'Select Campaigns to Import'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-dm-sans text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 font-dm-sans">
            {isUpdateMode ? (
              searchTerm 
                ? `Showing ${filteredCampaignData.length} of ${campaignData.length} campaigns (${filteredCampaignData.filter(c => isExistingCampaign(c.campaignName)).length} matching)`
                : `Found ${campaignData.length} campaigns in file (${campaignData.filter(c => isExistingCampaign(c.campaignName)).length} matching existing)`
            ) : (
              searchTerm 
                ? `Showing ${filteredCampaignData.length} of ${campaignData.length} campaigns`
                : `Found ${campaignData.length} campaigns in the uploaded file`
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMetricMapping(!showMetricMapping)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors font-dm-sans ${
                showMetricMapping 
                  ? 'text-red-600 bg-red-50' 
                  : unmatchedMetrics.length > 0
                    ? 'text-orange-600 hover:bg-orange-50 animate-pulse'
                    : 'text-green-600 hover:bg-green-50'
              }`}
            >
              {showMetricMapping 
                ? 'Hide Mapping' 
                : unmatchedMetrics.length > 0 
                  ? `Map Metrics (${unmatchedMetrics.length} need mapping)`
                  : 'Metric Mapping ✓'
              }
            </button>
            <button
              onClick={() => setShowClustering(!showClustering)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors font-dm-sans ${
                showClustering 
                  ? 'text-red-600 bg-red-50' 
                  : 'text-purple-600 hover:bg-purple-50'
              }`}
            >
              {showClustering ? 'Hide Clusters' : 'Create Clusters'}
            </button>
            <button
              onClick={handleSelectAll}
              className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-dm-sans"
            >
              {searchTerm ? `Select Filtered (${filteredCampaignData.length})` : 'Select All'}
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-xs px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-dm-sans"
            >
              {searchTerm ? `Deselect Filtered (${filteredCampaignData.length})` : 'Deselect All'}
            </button>
          </div>
        </div>

        {/* Clustering Interface */}
        {showClustering && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-800 mb-3 font-dm-sans">Campaign Clusters</h4>
            
            {/* Create New Cluster */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newClusterName}
                onChange={(e) => setNewClusterName(e.target.value)}
                placeholder="Enter cluster name (e.g., 'Phase 1', 'UAE', 'LinkedIn')"
                className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-dm-sans"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCluster()}
              />
              <button
                onClick={handleCreateCluster}
                disabled={!newClusterName.trim()}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center text-sm font-dm-sans"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Clusters */}
            {clusters.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-purple-700 mb-2 font-dm-sans">Click a cluster to make it active, then tick campaigns to add them to that cluster:</p>
                {clusters.map(cluster => (
                  <div 
                    key={cluster.id} 
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                      activeCluster === cluster.id 
                        ? 'bg-purple-100 border-purple-300 shadow-sm' 
                        : 'bg-white border-gray-200 hover:bg-purple-50'
                    }`}
                    onClick={() => setActiveCluster(activeCluster === cluster.id ? null : cluster.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        {activeCluster === cluster.id && (
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        )}
                        <span className={`text-sm font-medium font-dm-sans ${
                          activeCluster === cluster.id ? 'text-purple-800' : 'text-gray-700'
                        }`}>
                          {cluster.name}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-dm-sans ${
                        activeCluster === cluster.id 
                          ? 'text-purple-700 bg-purple-200' 
                          : 'text-gray-500 bg-gray-100'
                      }`}>
                        {cluster.campaigns.length} campaigns
                      </span>
                      {activeCluster === cluster.id && (
                        <span className="text-xs text-purple-600 font-medium font-dm-sans">ACTIVE</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCluster(cluster.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metric Mapping Interface */}
        {showMetricMapping && (
          <div className="flex-1 p-4 bg-orange-50 rounded-lg border border-orange-200 overflow-y-auto">
            <h4 className="text-sm font-medium text-orange-800 mb-3 font-dm-sans">Metric Mapping</h4>
            
            {/* Enhanced Summary */}
            <div className="mb-4 grid grid-cols-4 gap-3 text-xs">
              <div className="text-green-700 bg-green-100 p-3 rounded-lg">
                <div className="font-semibold flex items-center space-x-1">
                  <span>✅</span>
                  <span>Exact Matches</span>
                </div>
                <div className="text-lg font-bold">{exactMatches.length}</div>
                {exactMatches.length > 0 && (
                  <div className="mt-1 text-green-600 text-xs">
                    {exactMatches.slice(0, 2).join(', ')}
                    {exactMatches.length > 2 && ` +${exactMatches.length - 2} more`}
                  </div>
                )}
              </div>
              
              <div className="text-orange-700 bg-orange-100 p-3 rounded-lg">
                <div className="font-semibold flex items-center space-x-1">
                  <span>🔄</span>
                  <span>Need Mapping</span>
                </div>
                <div className="text-lg font-bold">{unmatchedMetrics.length}</div>
                <div className="text-xs mt-1">
                  {Object.keys(metricMapping).length} mapped
                </div>
              </div>
              
              <div className="text-blue-700 bg-blue-100 p-3 rounded-lg">
                <div className="font-semibold flex items-center space-x-1">
                  <span>🎯</span>
                  <span>Auto-Suggestions</span>
                </div>
                <div className="text-lg font-bold">
                  {potentialMatches.filter(p => p.similarMetrics.length > 0).length}
                </div>
                <div className="text-xs mt-1">
                  Smart matches found
                </div>
              </div>
              
              <div className="text-purple-700 bg-purple-100 p-3 rounded-lg">
                <div className="font-semibold flex items-center space-x-1">
                  <span>📊</span>
                  <span>Available</span>
                </div>
                <div className="text-lg font-bold">{availableMetrics.length}</div>
                <div className="text-xs mt-1">
                  Target columns
                </div>
              </div>
            </div>
            
            {/* Exact Matches Section */}
            {exactMatches.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="text-sm font-semibold text-green-800 mb-2 font-dm-sans">
                  ✅ Perfect Matches (Auto-Mapped)
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {exactMatches.map(metric => {
                    const sampleData = campaignData
                      .filter(c => c.data[metric])
                      .slice(0, 2)
                      .map(c => c.data[metric])
                      .filter(val => val && val.trim() !== '');
                    
                    return (
                      <div key={metric} className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-green-800 font-dm-sans">
                            "{metric}"
                          </div>
                          {sampleData.length > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              Sample: {sampleData.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-green-700">
                          <span className="text-sm">→</span>
                          <div className="bg-green-200 px-2 py-1 rounded text-xs font-medium">
                            {metric}
                          </div>
                          <span className="text-green-600">✓</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Smart Mapping Opportunities */}
            {unmatchedMetrics.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-orange-800 mb-3 font-dm-sans">
                  🔄 Mapping Opportunities ({unmatchedMetrics.length} metrics need attention)
                </h5>
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {potentialMatches.map(({ uploadedMetric, similarMetrics, confidence }) => {
                      // Show sample data for this metric
                      const sampleData = campaignData
                        .filter(c => c.data[uploadedMetric])
                        .slice(0, 3)
                        .map(c => c.data[uploadedMetric])
                        .filter(val => val && val.trim() !== '');
                      
                      const confidenceColors = {
                        high: 'border-green-300 bg-green-50',
                        medium: 'border-yellow-300 bg-yellow-50', 
                        low: 'border-gray-300 bg-gray-50'
                      };
                      
                      const confidenceIcons = {
                        high: '🎯',
                        medium: '💡',
                        low: '❓'
                      };
                      
                      return (
                        <div key={uploadedMetric} className={`flex flex-col space-y-3 p-4 rounded-lg border-2 shadow-sm ${
                          confidenceColors[confidence]
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{confidenceIcons[confidence]}</span>
                                <div className="text-sm font-medium text-gray-900 font-dm-sans">
                                  "{uploadedMetric}"
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-dm-sans ${
                                  confidence === 'high' ? 'bg-green-200 text-green-800' :
                                  confidence === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                  'bg-gray-200 text-gray-800'
                                }`}>
                                  {confidence} confidence
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                From uploaded file
                              </div>
                              {sampleData.length > 0 && (
                                <div className="text-xs text-blue-600 mt-1 font-dm-sans">
                                  📋 Sample: {sampleData.slice(0, 2).join(', ')}
                                  {sampleData.length > 2 && '...'}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Show suggested matches */}
                          {similarMetrics.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs text-gray-700 font-dm-sans font-medium">
                                💡 Smart Suggestions:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {similarMetrics.slice(0, 4).map(suggestion => (
                                  <button
                                    key={suggestion}
                                    onClick={() => {
                                      const newMapping = { ...metricMapping };
                                      newMapping[uploadedMetric] = suggestion;
                                      setMetricMapping(newMapping);
                                      console.log(`🎯 Quick-mapped: "${uploadedMetric}" → "${suggestion}"`);
                                    }}
                                    className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors font-dm-sans flex items-center space-x-1"
                                  >
                                    <span>⚡</span>
                                    <span>{suggestion}</span>
                                  </button>
                                ))}
                                {similarMetrics.length > 4 && (
                                  <span className="text-xs text-gray-500 font-dm-sans">
                                    +{similarMetrics.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Manual selection */}
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">→</span>
                            <select
                              value={metricMapping[uploadedMetric] || ''}
                              onChange={(e) => {
                                console.log(`🔄 Mapping "${uploadedMetric}" to "${e.target.value}"`);
                                const newMapping = { ...metricMapping };
                                if (e.target.value === '') {
                                  delete newMapping[uploadedMetric];
                                  console.log(`❌ Removed mapping for "${uploadedMetric}"`);
                                } else if (e.target.value === '__CREATE_NEW__') {
                                  // Handle create new metric - use the uploaded metric name as new column
                                  const newMetricName = uploadedMetric;
                                  newMapping[uploadedMetric] = newMetricName;
                                  console.log(`✨ Created new metric column: "${uploadedMetric}" → "${newMetricName}"`);
                                } else {
                                  newMapping[uploadedMetric] = e.target.value;
                                  console.log(`✅ Set mapping: "${uploadedMetric}" → "${e.target.value}"`);
                                }
                                setMetricMapping(newMapping);
                              }}
                              className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 font-dm-sans focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="">Choose target column...</option>
                              <optgroup label="📊 Existing Metrics in Spreadsheet ({availableMetrics.length})">
                                {availableMetrics.map(targetMetric => (
                                  <option key={targetMetric} value={targetMetric}>
                                    {targetMetric}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="✨ Create New Metric">
                                <option value="__CREATE_NEW__">
                                  ➕ Create New Column: "{uploadedMetric}"
                                </option>
                              </optgroup>
                            </select>
                          </div>
                          
                          {metricMapping[uploadedMetric] && (
                            <div className={`flex items-center space-x-2 text-sm p-3 rounded-lg border ${
                              availableMetrics.includes(metricMapping[uploadedMetric])
                                ? 'text-green-700 bg-green-100 border-green-200'
                                : 'text-blue-700 bg-blue-100 border-blue-200'
                            }`}>
                              <span>{availableMetrics.includes(metricMapping[uploadedMetric]) ? '✅' : '✨'}</span>
                              <span className="font-dm-sans font-medium">
                                {availableMetrics.includes(metricMapping[uploadedMetric])
                                  ? `Will map to existing column: "${metricMapping[uploadedMetric]}"`
                                  : `Will create new column: "${metricMapping[uploadedMetric]}"`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-orange-200">
                  <button
                    onClick={() => {
                      console.log('🤖 Auto-mapping similar metrics...');
                      const newMapping = { ...metricMapping };
                      let mappedCount = 0;
                      
                      unmatchedMetrics.forEach(uploadedMetric => {
                        const uploadedLower = uploadedMetric.toLowerCase();
                        
                        // Try exact match first
                        let similarTarget = availableMetrics.find(targetMetric => 
                          targetMetric.toLowerCase() === uploadedLower
                        );
                        
                        // Try partial matches
                        if (!similarTarget) {
                          similarTarget = availableMetrics.find(targetMetric => {
                            const targetLower = targetMetric.toLowerCase();
                            return targetLower.includes(uploadedLower) || uploadedLower.includes(targetLower);
                          });
                        }
                        
                        // Try common aliases
                        if (!similarTarget) {
                          const aliases = {
                            'cost': ['amount spent', 'spend', 'cost'],
                            'spend': ['amount spent', 'cost', 'spend'],
                            'amount spent': ['cost', 'spend', 'amount spent'],
                            'impr.': ['impressions'],
                            'impressions': ['impr.', 'impressions'],
                            'link clicks': ['clicks'],
                            'clicks': ['link clicks', 'clicks']
                          };
                          
                          const possibleAliases = aliases[uploadedLower] || [];
                          similarTarget = availableMetrics.find(targetMetric => 
                            possibleAliases.some(alias => targetMetric.toLowerCase().includes(alias))
                          );
                        }
                        
                        if (similarTarget) {
                          newMapping[uploadedMetric] = similarTarget;
                          mappedCount++;
                          console.log(`🎯 Auto-mapped: "${uploadedMetric}" → "${similarTarget}"`);
                        }
                      });
                      
                      setMetricMapping(newMapping);
                      console.log(`✅ Auto-mapped ${mappedCount} out of ${unmatchedMetrics.length} metrics`);
                    }}
                    className="text-xs px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-dm-sans flex items-center space-x-1"
                  >
                    <span>🤖</span>
                    <span>Auto-map Similar ({unmatchedMetrics.length})</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('🧹 Clearing all metric mappings...');
                      setMetricMapping({});
                    }}
                    className="text-xs px-3 py-1 text-orange-600 hover:bg-orange-100 rounded transition-colors font-dm-sans flex items-center space-x-1"
                  >
                    <span>🧹</span>
                    <span>Clear All</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('📋 Mapping all unmatched metrics to "Don\'t map"...');
                      const newMapping = { ...metricMapping };
                      unmatchedMetrics.forEach(metric => {
                        delete newMapping[metric];
                      });
                      setMetricMapping(newMapping);
                    }}
                    className="text-xs px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors font-dm-sans flex items-center space-x-1"
                  >
                    <span>⏭️</span>
                    <span>Skip All</span>
                  </button>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-600 font-dm-sans">
                    <span>📊</span>
                    <span>
                      Mapped: {Object.keys(metricMapping).length}/{unmatchedMetrics.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {unmatchedMetrics.length === 0 && (
              <div className="text-center py-4">
                <div className="text-green-600 text-sm font-dm-sans">
                  ✅ All metrics match exactly! No manual mapping needed.
                </div>
              </div>
            )}
          </div>
        )}

        {!showMetricMapping && (
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 space-y-2 min-h-0">
          {activeCluster && (
            <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-700 font-dm-sans">
                ✓ Active Cluster: <span className="font-semibold">{clusters.find(c => c.id === activeCluster)?.name}</span> - Tick campaigns below to add them to this cluster
              </p>
            </div>
          )}
          
          {filteredCampaignData.map((campaign) => {
            const assignedCluster = getCampaignCluster(campaign.campaignName);
            const isMatching = isUpdateMode && isExistingCampaign(campaign.campaignName);
            
            return (
              <div
                key={campaign.campaignName}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                  isUpdateMode 
                    ? (isMatching 
                        ? 'hover:bg-green-50 border border-green-200' 
                        : 'hover:bg-red-50 border border-red-200 opacity-75')
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleToggleCampaign(campaign.campaignName)}
              >
                <input
                  type="checkbox"
                  checked={selectedCampaigns.includes(campaign.campaignName)}
                  onChange={() => handleToggleCampaign(campaign.campaignName)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  onClick={(e) => e.stopPropagation()} // Allow direct checkbox clicks
                />
                <div className="flex-1 flex items-center space-x-2">
                  <span className={`text-sm font-medium font-dm-sans ${
                    isUpdateMode 
                      ? (isMatching ? 'text-green-700' : 'text-red-600')
                      : 'text-gray-700'
                  }`}>
                    {campaign.campaignName}
                  </span>
                  {isUpdateMode && (
                    <span className={`text-xs px-2 py-1 rounded-full font-dm-sans ${
                      isMatching 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {isMatching ? 'WILL UPDATE' : 'NOT FOUND'}
                    </span>
                  )}
                </div>
                
                {/* Show assigned cluster indicator */}
                {assignedCluster && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-dm-sans">
                    {assignedCluster.name}
                  </span>
                )}
                
                <span className="text-xs text-gray-500 font-dm-sans">
                  {Object.keys(campaign.data).length} metrics
                </span>
              </div>
            );
          })}
        </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-dm-sans"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCampaigns.length === 0}
            className={`px-4 py-2 rounded-xl transition-all duration-200 shadow-sm font-dm-sans flex items-center space-x-2 ${
              selectedCampaigns.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isUpdateMode ? `Update ${selectedCampaigns.length} Campaigns` : `Import ${selectedCampaigns.length} Campaigns`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignSelectionModal;