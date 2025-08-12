import React, { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Download, Trash2, Edit3, FolderOpen, Copy, Edit2, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import logoNew from './logo-new.png';
import FortuneSheetComponent from './FortuneSheetComponent';
import MetricsAutocomplete from './MetricsAutocomplete';
import CampaignSelectionModal from './CampaignSelectionModal';
import { CampaignService, SaveCampaignData, Campaign as SavedCampaign } from './lib/campaignService';

// Complete metrics list
const ALL_METRICS = [
  'Date',
  'Impressions',
  'Reach',
  'Frequency',
  'Clicks',
  'CTR',
  'Amount Spent',
  'CPM',
  'CPC',
  'CPA',
  'ROAS',
  'Post Engagement',
  'Video Views',
  'ThruPlays',
  'Page Likes',
  'Page Follows',
  'Conversions',
  'Purchase Value',
  'Leads',
  'Add to Cart',
  'Initiate Checkout',
  'Custom Events',
  'Attribution Window',
  'View-through Conversions',
  'Click-through Conversions',
  'Ad ID',
  'Ad Name',
  'Ad Set ID',
  'Ad Set Name',
  'Campaign ID',
  'Campaign Name',
  'Ad Delivery',
  'Ad Status',
  'Objective',
  'Placement',
  'Device Platform',
  'Platform',
  'Engagement Rate',
  'Scroll Depth',
  'Landing Page Views',
  'Link Clicks',
  'Outbound Clicks',
  'Unique Clicks',
  'Unique CTR',
  'Video Plays at 25%',
  'Video Plays at 50%',
  'Video Plays at 75%',
  'Video Plays at 95%',
  'Video Plays at 100%',
  '3-Second Video Plays',
  '10-Second Video Plays',
  'Cost per ThruPlay',
  'Cost per Result',
  'Results',
  'Result Rate',
  'Website Purchases',
  'Website Purchase ROAS',
  'Mobile App Installs',
  'App Events',
  'Cost per Mobile App Install',
  'Messaging Conversations Started',
  'Cost per Messaging Conversation',
  'Lead Form Opens',
  'Lead Form Completions',
  'Cost per Lead',
  'Checkouts Initiated',
  'Content Views',
  'Cost per Content View',
  'Page Engagement',
  'Post Saves',
  'Post Shares',
  'Profile Visits',
  'Page Views',
  'Website Clicks',
  'Add Payment Info',
  'Cost per Add Payment Info',
  'Offline Conversions',
  'Offline Purchase Value',
  'Impressions Share',
  'Quality Ranking',
  'Engagement Rate Ranking',
  'Conversion Rate Ranking'
];

// Default metrics (first 10) - ensure Campaign Name is included
const DEFAULT_METRICS = ['Campaign Name', 'Date', 'Impressions', 'Reach', 'Frequency', 'Clicks', 'CTR', 'Amount Spent', 'CPM', 'CPC'];

interface Campaign {
  data: string[][];
  metrics: string[];
}

interface UploadedCampaignData {
  campaignName: string;
  data: { [key: string]: string };
  cluster?: string; // Add cluster information
}

interface Cluster {
  id: string;
  name: string;
  campaigns: string[];
}

interface Brand {
  id: number;
  name: string;
  logo: string | null;
  campaigns: {
    [key: string]: Campaign;
  };
  uploadedCampaignData?: UploadedCampaignData[]; // Store uploaded data at brand level
}

interface CustomMetric {
  name: string;
  keywords: string[];
  operator: 'AND' | 'OR';
}

const AdReportingTool = () => {
  console.log('AdReportingTool component initializing...');
  
  const [brands, setBrands] = useState<Brand[]>([
    { 
      id: 1, 
      name: 'Sample Brand', 
      logo: null,
      campaigns: {
        'Campaign 1': {
          data: (() => {
            const initialData = [];
            for (let i = 0; i < 20; i++) {
              const row = [];
              for (let j = 0; j < DEFAULT_METRICS.length; j++) {
                if (i === 0) {
                  row.push(DEFAULT_METRICS[j]);
                } else {
                  row.push('');
                }
              }
              initialData.push(row);
            }
            return initialData;
          })(),
          metrics: DEFAULT_METRICS
        }
      }
    }
  ]);
  const [selectedBrand, setSelectedBrand] = useState(1);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Campaign 1');
  const [campaigns, setCampaigns] = useState(['Campaign 1']);
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<any>({ show: false, x: 0, y: 0, type: null, target: null });
  const [showCampaignSelection, setShowCampaignSelection] = useState(false);
  const [uploadedCampaignData, setUploadedCampaignData] = useState<any[]>([]);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  
  // Campaign management state
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveAsNewName, setSaveAsNewName] = useState('');
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  
  // Get selected metrics for current brand and campaign
  const getSelectedMetrics = () => {
    const currentBrand = brands.find(b => b.id === selectedBrand);
    return currentBrand?.campaigns[activeTab]?.metrics || DEFAULT_METRICS;
  };
  
  const selectedMetrics = getSelectedMetrics();
  
  // Get existing campaign names from current spreadsheet
  const getCurrentExistingCampaigns = () => {
    const currentBrand = brands.find(b => b.id === selectedBrand);
    if (!currentBrand) return [];
    
    const currentData = currentBrand.campaigns[activeTab].data;
    const existingCampaigns = [];
    
    // Search through all cells to find campaign names
    for (let rowIndex = 0; rowIndex < currentData.length; rowIndex++) {
      for (let colIndex = 0; colIndex < currentData[rowIndex].length; colIndex++) {
        const cellValue = currentData[rowIndex][colIndex];
        if (cellValue && cellValue.trim() !== '' && 
            !DEFAULT_METRICS.includes(cellValue) &&
            cellValue !== 'Campaign Name') {
          // Check if this might be a campaign name (not a number or common header)
          if (isNaN(Number(cellValue)) && !cellValue.includes('%') && 
              !cellValue.includes('$') && cellValue.length > 3) {
            existingCampaigns.push(cellValue);
          }
        }
      }
    }
    
    // Remove duplicates and return
    return [...new Set(existingCampaigns)];
  };
  
  // Get current spreadsheet data for selected brand and campaign
  const getCurrentSpreadsheetData = () => {
    const currentBrand = brands.find(b => b.id === selectedBrand);
    return currentBrand?.campaigns[activeTab]?.data || [];
  };
  
  
  // Memoize the spreadsheet data to prevent unnecessary re-renders, but include selectedMetrics as dependency
  const memoizedSpreadsheetData = React.useMemo(() => {
    return getCurrentSpreadsheetData();
  }, [brands, selectedBrand, activeTab, selectedMetrics]);

  // Load saved campaigns on component mount
  useEffect(() => {
    // Only load campaigns if Supabase is properly configured
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      loadSavedCampaigns();
    } else {
      console.warn('Supabase not configured - skipping campaign loading');
    }
  }, []);

  const loadSavedCampaigns = async () => {
    try {
      setIsLoading(true);
      const campaigns = await CampaignService.getCampaigns();
      setSavedCampaigns(campaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      // Don't show alert on initial load failure
      setSavedCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCampaign = async (name: string, isNew = false) => {
    try {
      setIsSaving(true);
      console.log('Attempting to save campaign:', name);
      
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        alert('Supabase is not configured. Please add environment variables.');
        return;
      }

      const currentBrand = brands.find(b => b.id === selectedBrand);
      if (!currentBrand) {
        alert('No brand selected');
        return;
      }

      const campaignData: SaveCampaignData = {
        name,
        metrics: selectedMetrics,
        data: currentBrand.campaigns[activeTab].data
      };

      console.log('Campaign data to save:', campaignData);

      if (isNew || !currentCampaignId) {
        console.log('Saving new campaign...');
        const saved = await CampaignService.saveCampaign(campaignData);
        console.log('Saved campaign result:', saved);
        setCurrentCampaignId(saved.id || null);
        alert(`Campaign "${name}" saved successfully!`);
      } else {
        console.log('Updating existing campaign...');
        await CampaignService.updateCampaign(currentCampaignId, campaignData);
        alert(`Campaign "${name}" updated successfully!`);
      }

      await loadSavedCampaigns();
    } catch (error) {
      console.error('Failed to save campaign:', error);
      alert(`Failed to save campaign: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
      setShowSaveAsDialog(false);
      setSaveAsNewName('');
    }
  };

  const handleLoadCampaign = async (campaign: SavedCampaign) => {
    try {
      const currentBrand = brands.find(b => b.id === selectedBrand);
      if (!currentBrand) return;

      // Update the current campaign with loaded data
      setBrands(brands.map(brand => 
        brand.id === selectedBrand 
          ? {
              ...brand,
              campaigns: {
                ...brand.campaigns,
                [activeTab]: {
                  data: campaign.data,
                  metrics: campaign.metrics
                }
              }
            }
          : brand
      ));

      setCurrentCampaignId(campaign.id || null);
      setShowLoadDialog(false);
      alert(`Campaign "${campaign.name}" loaded successfully!`);
    } catch (error) {
      console.error('Failed to load campaign:', error);
      alert('Failed to load campaign');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<any>(null);

  const handleBrandUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (editingBrand && result && typeof result === 'string') {
          // Update existing brand - always update logo and name if provided
          setBrands(brands.map(brand => 
            brand.id === editingBrand.id 
              ? { ...brand, logo: result, name: brandName.trim() || brand.name }
              : brand
          ));
          // Close modal after updating existing brand
          setShowBrandModal(false);
          setEditingBrand(null);
          setBrandName('');
        } else if (result && typeof result === 'string') {
          // For NEW brands, store the logo temporarily until name is provided
          setTempLogo(result);
          console.log('📷 Logo uploaded and stored temporarily, waiting for brand name...');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to find the row that contains campaign headers
  const findHeaderRow = (rows: string[][]): { headerRowIndex: number, campaignColumnIndex: number, headers: string[] } => {
    const targetHeaders = [
      'Campaign Name',
      'Campaign',
      'Campaign Group Name'
    ];

    console.log(`Searching through ${Math.min(rows.length, 20)} rows for header row...`);

    // Search through more rows (up to 20) and look more carefully
    for (let rowIndex = 0; rowIndex < Math.min(rows.length, 20); rowIndex++) {
      const row = rows[rowIndex];
      if (!row || row.length === 0) continue;

      // Look through ALL columns in each row, not just the first few
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cell = row[colIndex];
        if (!cell) continue;
        
        const trimmedCell = cell.trim();
        
        // Check if this cell matches any of our target headers
        const isMatch = targetHeaders.some(target => 
          trimmedCell.toLowerCase() === target.toLowerCase()
        );

        if (isMatch) {
          console.log(`✅ Found campaign header "${trimmedCell}" at row ${rowIndex}, column ${colIndex}`);
          console.log(`✅ Full row:`, row);
          return {
            headerRowIndex: rowIndex,
            campaignColumnIndex: colIndex,
            headers: row
          };
        }
      }
    }

    // If not found, show debugging info
    console.log('❌ No campaign header found. Showing all rows for debugging:');
    rows.slice(0, 20).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });
    
    return { headerRowIndex: -1, campaignColumnIndex: -1, headers: [] };
  };


  // Helper function to detect platform from campaign data
  const detectPlatform = (campaignNames: string[], headers: string[]): 'google' | 'meta' | 'linkedin' | 'unknown' => {
    // Check headers first for platform-specific indicators
    const headerText = headers.join(' ');
    const headerTextLower = headerText.toLowerCase();
    
    // Check for Google-specific headers (including "Impr." and "Cost")
    if (headerText.includes('Impr.') || headerTextLower.includes('campaign group name') || 
        (headerText.includes('Cost') && !headerTextLower.includes('amount spent'))) {
      console.log('🎯 Platform detected: Google (Google-specific headers found)');
      return 'google';
    }
    
    // Check for Meta-specific headers (including "Amount spent (XXX)")
    if (headerTextLower.includes('link clicks') || headerTextLower.includes('post engagement') ||
        headerTextLower.includes('amount spent')) {
      console.log('🎯 Platform detected: Meta (Meta-specific headers found)');
      return 'meta';
    }
    
    // Check campaign names for platform indicators
    const allCampaignText = campaignNames.join(' ').toLowerCase();
    
    if (allCampaignText.includes('linkedin') || allCampaignText.includes('_linkedin_')) {
      console.log('🎯 Platform detected: LinkedIn (campaign names contain "linkedin")');
      return 'linkedin';
    }
    
    if (allCampaignText.includes('google') || allCampaignText.includes('_google_') || allCampaignText.includes('_ggl_')) {
      console.log('🎯 Platform detected: Google (campaign names contain platform indicators)');
      return 'google';
    }
    
    if (allCampaignText.includes('meta') || allCampaignText.includes('facebook') || allCampaignText.includes('_fb_') || allCampaignText.includes('_meta_')) {
      console.log('🎯 Platform detected: Meta (campaign names contain platform indicators)');
      return 'meta';
    }
    
    console.log('❓ Platform detection: Unknown');
    return 'unknown';
  };

  // Helper function to map platform-specific metrics
  const mapPlatformMetrics = (originalData: { [key: string]: string }, platform: 'google' | 'meta' | 'linkedin' | 'unknown'): { [key: string]: string } => {
    const mappedData = { ...originalData };
    
    // Map impressions based on platform - Google uses "Impr."
    const impressionMappings = {
      google: ['Impr.', 'Impressions', 'Impression'],
      meta: ['Impressions', 'Impression'],
      linkedin: ['Impressions'],
      unknown: ['Impr.', 'Impressions', 'Impression']
    };
    
    const possibleImpressionHeaders = impressionMappings[platform];
    
    // Find the impression metric in the original data (case-insensitive)
    for (const impressionHeader of possibleImpressionHeaders) {
      // Try exact match first
      if (originalData[impressionHeader]) {
        mappedData['Impressions'] = originalData[impressionHeader];
        console.log(`📊 Mapped "${impressionHeader}" → "Impressions" for ${platform} platform`);
        break;
      }
      
      // Try case-insensitive match
      const foundKey = Object.keys(originalData).find(key => 
        key.toLowerCase() === impressionHeader.toLowerCase()
      );
      
      if (foundKey) {
        mappedData['Impressions'] = originalData[foundKey];
        console.log(`📊 Mapped "${foundKey}" → "Impressions" for ${platform} platform (case-insensitive)`);
        break;
      }
    }
    
    // Map Amount Spent based on platform
    // Meta uses "Amount spent (XXX)" where XXX is the currency
    // Google uses "Cost"
    if (platform === 'meta') {
      // Look for "Amount spent" with any currency suffix
      const amountSpentKey = Object.keys(originalData).find(key => 
        key.toLowerCase().startsWith('amount spent')
      );
      
      if (amountSpentKey) {
        mappedData['Amount Spent'] = originalData[amountSpentKey];
        console.log(`📊 Mapped "${amountSpentKey}" → "Amount Spent" for Meta platform`);
      }
    } else if (platform === 'google') {
      // Google uses "Cost" for amount spent
      if (originalData['Cost']) {
        mappedData['Amount Spent'] = originalData['Cost'];
        console.log(`📊 Mapped "Cost" → "Amount Spent" for Google platform`);
      } else {
        // Try case-insensitive match
        const costKey = Object.keys(originalData).find(key => 
          key.toLowerCase() === 'cost'
        );
        
        if (costKey) {
          mappedData['Amount Spent'] = originalData[costKey];
          console.log(`📊 Mapped "${costKey}" → "Amount Spent" for Google platform (case-insensitive)`);
        }
      }
    } else {
      // For other platforms, try to find "Amount Spent" or "Cost"
      const amountSpentKey = Object.keys(originalData).find(key => {
        const lower = key.toLowerCase();
        return lower.startsWith('amount spent') || lower === 'cost';
      });
      
      if (amountSpentKey) {
        mappedData['Amount Spent'] = originalData[amountSpentKey];
        console.log(`📊 Mapped "${amountSpentKey}" → "Amount Spent" for ${platform} platform`);
      }
    }
    
    // Map clicks based on platform
    const clickMappings = {
      google: ['Clicks', 'Click'],
      meta: ['Link Clicks', 'Website Clicks', 'Clicks'],
      linkedin: ['Clicks'],
      unknown: ['Clicks', 'Link Clicks', 'Click']
    };
    
    const possibleClickHeaders = clickMappings[platform];
    
    // Find the click metric in the original data (case-insensitive)
    for (const clickHeader of possibleClickHeaders) {
      // Try exact match first
      if (originalData[clickHeader]) {
        mappedData['Clicks'] = originalData[clickHeader];
        console.log(`📊 Mapped "${clickHeader}" → "Clicks" for ${platform} platform`);
        break;
      }
      
      // Try case-insensitive match
      const foundKey = Object.keys(originalData).find(key => 
        key.toLowerCase() === clickHeader.toLowerCase()
      );
      
      if (foundKey) {
        mappedData['Clicks'] = originalData[foundKey];
        console.log(`📊 Mapped "${foundKey}" → "Clicks" for ${platform} platform (case-insensitive)`);
        break;
      }
    }
    
    // Calculate CPM if we have both Impressions and Amount Spent
    // CPM = (Cost / Impressions) × 1000
    if (mappedData['Impressions'] && mappedData['Amount Spent']) {
      const impressions = parseFloat(mappedData['Impressions'].replace(/,/g, ''));
      const amountSpent = parseFloat(mappedData['Amount Spent'].replace(/[^0-9.-]/g, ''));
      
      if (!isNaN(impressions) && !isNaN(amountSpent) && impressions > 0) {
        const cpm = (amountSpent / impressions) * 1000;
        mappedData['CPM'] = cpm.toFixed(2);
        console.log(`📊 Calculated CPM: ${mappedData['CPM']} (Cost: ${amountSpent}, Impressions: ${impressions})`);
      }
    }
    
    // Calculate CPC if we have both Clicks and Amount Spent
    // CPC = Cost / Clicks
    if (mappedData['Clicks'] && mappedData['Amount Spent']) {
      const clicks = parseFloat(mappedData['Clicks'].replace(/,/g, ''));
      const amountSpent = parseFloat(mappedData['Amount Spent'].replace(/[^0-9.-]/g, ''));
      
      if (!isNaN(clicks) && !isNaN(amountSpent) && clicks > 0) {
        const cpc = amountSpent / clicks;
        mappedData['CPC'] = cpc.toFixed(2);
        console.log(`📊 Calculated CPC: ${mappedData['CPC']} (Cost: ${amountSpent}, Clicks: ${clicks})`);
      }
    }
    
    // Calculate CTR if we have both Clicks and Impressions
    // CTR = (Clicks / Impressions) × 100
    if (mappedData['Clicks'] && mappedData['Impressions']) {
      const clicks = parseFloat(mappedData['Clicks'].replace(/,/g, ''));
      const impressions = parseFloat(mappedData['Impressions'].replace(/,/g, ''));
      
      if (!isNaN(clicks) && !isNaN(impressions) && impressions > 0) {
        const ctr = (clicks / impressions) * 100;
        mappedData['CTR'] = ctr.toFixed(2) + '%';
        console.log(`📊 Calculated CTR: ${mappedData['CTR']} (Clicks: ${clicks}, Impressions: ${impressions})`);
      }
    }
    
    return mappedData;
  };

  // Helper function to process a single file
  const processSingleFile = (file: File): Promise<UploadedCampaignData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      if (file.name.endsWith('.csv')) {
        // Handle CSV files
        reader.onload = (e) => {
          const text = e.target?.result;
          if (!text || typeof text !== 'string') {
            reject('Failed to read file');
            return;
          }
          
          try {
            console.log(`Processing CSV: ${file.name}`);
            console.log(`File size: ${text.length} characters`);
            
            // Step 1: Properly divide into rows first
            const rawLines = text.split(/\r?\n/);
            console.log(`Raw lines count: ${rawLines.length}`);
            
            // Step 2: Clean and filter rows
            const cleanLines = rawLines
              .map((line, index) => {
                const cleaned = line.trim();
                if (index < 10) console.log(`Line ${index}: "${cleaned}"`);
                return cleaned;
              })
              .filter(line => line.length > 0); // Remove empty lines
            
            console.log(`Clean lines count: ${cleanLines.length}`);
            
            // Step 3: Auto-detect delimiter and parse columns
            function detectDelimiter(lines: string[]): string {
              const delimiters = ['\t', ',', ';', '|'];
              let bestDelimiter = ',';
              let maxColumns = 0;
              
              // Check first few non-empty lines to detect delimiter
              const sampleLines = lines.slice(0, 10).filter(line => line.trim());
              
              for (const delimiter of delimiters) {
                let totalColumns = 0;
                for (const line of sampleLines) {
                  const columns = line.split(delimiter).length;
                  totalColumns += columns;
                }
                const avgColumns = totalColumns / sampleLines.length;
                
                if (avgColumns > maxColumns) {
                  maxColumns = avgColumns;
                  bestDelimiter = delimiter;
                }
              }
              
              console.log(`Detected delimiter: "${bestDelimiter}" (${bestDelimiter === '\t' ? 'TAB' : 'COMMA'}), avg columns: ${maxColumns}`);
              return bestDelimiter;
            }
            
            const delimiter = detectDelimiter(cleanLines);
            
            function parseDelimitedLine(line: string, delimiter: string): string[] {
              if (delimiter === '\t') {
                // For tab-separated files, simple split works fine
                return line.split('\t').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
              } else {
                // For comma-separated files, handle quotes properly
                const result: string[] = [];
                let current = '';
                let inQuotes = false;
                let i = 0;
                
                while (i < line.length) {
                  const char = line[i];
                  
                  if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                      // Escaped quote
                      current += '"';
                      i += 2;
                    } else {
                      // Toggle quote state
                      inQuotes = !inQuotes;
                      i++;
                    }
                  } else if (char === delimiter && !inQuotes) {
                    // End of field
                    result.push(current.trim());
                    current = '';
                    i++;
                  } else {
                    current += char;
                    i++;
                  }
                }
                
                // Add the last field
                result.push(current.trim());
                return result.map(cell => cell.replace(/^["']|["']$/g, ''));
              }
            }
            
            // Step 4: Convert all lines to structured rows
            const allRows: string[][] = [];
            for (let i = 0; i < cleanLines.length; i++) {
              const line = cleanLines[i];
              const columns = parseDelimitedLine(line, delimiter);
              
              // Clean each cell
              const cleanColumns = columns.map(cell => 
                cell.replace(/^["']|["']$/g, '').trim()
              );
              
              allRows.push(cleanColumns);
              
              // Debug first 10 rows
              if (i < 10) {
                console.log(`Row ${i} parsed (${cleanColumns.length} columns):`, cleanColumns);
              }
            }
            
            console.log(`Total structured rows: ${allRows.length}`);
            
            // Step 5: Look for campaign-related headers in all rows
            console.log('=== SEARCHING FOR CAMPAIGN HEADERS ===');
            for (let rowIndex = 0; rowIndex < Math.min(allRows.length, 20); rowIndex++) {
              const row = allRows[rowIndex];
              for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const cell = row[colIndex];
                if (cell && cell.toLowerCase().includes('campaign')) {
                  console.log(`Found "campaign" at Row ${rowIndex}, Column ${colIndex}: "${cell}"`);
                }
              }
            }
            console.log('=== END CAMPAIGN SEARCH ===');
            
            if (allRows.length < 2) {
              reject('File must have at least headers and one data row');
              return;
            }
            
            // Find the header row dynamically
            const { headerRowIndex, campaignColumnIndex, headers } = findHeaderRow(allRows);
            
            if (headerRowIndex === -1 || campaignColumnIndex === -1) {
              console.log('Available rows for debugging:');
              allRows.slice(0, 10).forEach((row, i) => {
                console.log(`Row ${i}:`, row);
              });
              reject(`No campaign name column found in "${file.name}". Expected: "Campaign Name", "Campaign", or "Campaign Group Name"`);
              return;
            }
            
            console.log(`Found campaign header: "${headers[campaignColumnIndex]}" at row ${headerRowIndex}, column ${campaignColumnIndex}`);
            
            // Parse campaign data starting from row after headers
            const campaignDataMap = new Map<string, UploadedCampaignData>();
            
            for (let i = headerRowIndex + 1; i < allRows.length; i++) {
              const cells = allRows[i];
              if (cells.length <= campaignColumnIndex) continue;
              
              const campaignName = cells[campaignColumnIndex]?.trim();
              
              if (campaignName) {
                // Skip rows that contain "Total" or "total" in the campaign name or any cell
                const campaignNameLower = campaignName.toLowerCase();
                const shouldSkip = campaignNameLower.includes('total') || 
                                 cells.some(cell => cell && cell.toLowerCase().includes('total'));
                
                if (shouldSkip) {
                  console.log(`🚫 Skipping total row: "${campaignName}" (full row: ${cells.slice(0, 5).join(', ')}...)`);
                  continue;
                }
                
                console.log(`✅ Including campaign: "${campaignName}"`);
                
                
                const rowData: { [key: string]: string } = {};
                headers.forEach((header, index) => {
                  if (index !== campaignColumnIndex && header?.trim()) {
                    rowData[header.trim()] = cells[index]?.trim() || '';
                  }
                });
                
                if (!campaignDataMap.has(campaignName)) {
                  campaignDataMap.set(campaignName, {
                    campaignName,
                    data: rowData
                  });
                }
              }
            }
            
            const result = Array.from(campaignDataMap.values());
            console.log(`Extracted ${result.length} unique campaigns`);
            
            // Detect platform and apply metric mapping
            if (result.length > 0) {
              const campaignNames = result.map(c => c.campaignName);
              const platform = detectPlatform(campaignNames, headers);
              
              // Apply platform-specific metric mapping
              const mappedResult = result.map(campaign => ({
                ...campaign,
                data: mapPlatformMetrics(campaign.data, platform)
              }));
              
              resolve(mappedResult);
            } else {
              resolve(result);
            }
          } catch (error) {
            console.error('CSV parsing error:', error);
            reject(`Error parsing CSV file: ${error}`);
          }
        };
        reader.readAsText(file);
      } else {
        // Handle Excel files (.xlsx, .xls)
        reader.onload = (e) => {
          const data = e.target?.result;
          if (!data) {
            reject('Failed to read file');
            return;
          }
          
          try {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length < 2) {
              reject('File must have at least headers and one data row');
              return;
            }
            
            console.log(`File: ${file.name}, Total rows: ${jsonData.length}`);
            
            // Convert to string arrays and filter empty rows
            const allRows = jsonData
              .map(row => row.map((cell: any) => String(cell || '').trim()))
              .filter(row => row.some(cell => cell !== ''));
            
            // Find the header row dynamically
            const { headerRowIndex, campaignColumnIndex, headers } = findHeaderRow(allRows);
            
            if (headerRowIndex === -1 || campaignColumnIndex === -1) {
              reject(`No campaign name column found in "${file.name}". Expected: "Campaign Name", "Campaign", or "Campaign Group Name"`);
              return;
            }
            
            console.log(`Using header "${headers[campaignColumnIndex]}" as campaign name column`);
            
            // Parse campaign data starting from row after headers
            const campaignDataMap = new Map<string, UploadedCampaignData>();
            
            for (let i = headerRowIndex + 1; i < allRows.length; i++) {
              const row = allRows[i];
              const campaignName = row[campaignColumnIndex];
              
              if (campaignName && campaignName.trim()) {
                // Skip rows that contain "Total" or "total" in the campaign name or any cell
                const campaignNameLower = campaignName.toLowerCase();
                const shouldSkip = campaignNameLower.includes('total') || 
                                 row.some(cell => cell && String(cell).toLowerCase().includes('total'));
                
                if (shouldSkip) {
                  console.log(`🚫 Skipping total row: "${campaignName}" (full row: ${row.slice(0, 5).join(', ')}...)`);
                  continue;
                }
                
                console.log(`✅ Including campaign: "${campaignName}"`);
                
                
                const rowData: { [key: string]: string } = {};
                headers.forEach((header, index) => {
                  if (index !== campaignColumnIndex && header.trim() && row[index] !== undefined) {
                    rowData[header] = String(row[index]);
                  }
                });
                
                if (!campaignDataMap.has(campaignName)) {
                  campaignDataMap.set(campaignName, {
                    campaignName,
                    data: rowData
                  });
                }
              }
            }
            
            const result = Array.from(campaignDataMap.values());
            console.log(`Extracted ${result.length} unique campaigns from Excel`);
            
            // Detect platform and apply metric mapping
            if (result.length > 0) {
              const campaignNames = result.map(c => c.campaignName);
              const platform = detectPlatform(campaignNames, headers);
              
              // Apply platform-specific metric mapping
              const mappedResult = result.map(campaign => ({
                ...campaign,
                data: mapPlatformMetrics(campaign.data, platform)
              }));
              
              resolve(mappedResult);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(`Error parsing Excel file: ${error}`);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleXlsxUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    console.log('📁 File upload triggered, update mode:', isUpdateMode);

    try {
      // Process all selected files
      const allCampaignData: UploadedCampaignData[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        try {
          const campaignData = await processSingleFile(files[i]);
          allCampaignData.push(...campaignData);
        } catch (error) {
          errors.push(`${files[i].name}: ${error}`);
        }
      }

      // Show errors if any
      if (errors.length > 0) {
        alert(`Errors processing some files:\n${errors.join('\n')}`);
      }

      // Show campaign selection if we have any valid data
      if (allCampaignData.length > 0) {
        setUploadedCampaignData(allCampaignData);
        
        if (isUpdateMode) {
          // UPDATE MODE: Show modal with matching campaigns
          console.log('🔄 Update mode: showing selection modal for matching campaigns');
          setShowCampaignSelection(true);
        } else {
          // UPLOAD MODE: Show selection modal
          console.log('📤 Upload mode: showing selection modal');
          setShowCampaignSelection(true);
        }
      } else if (errors.length === 0) {
        alert('No valid campaign data found in any of the files');
      }

    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files. Please try again.');
    }

    // Clear the file input so the same files can be uploaded again if needed
    event.target.value = '';
  };

  // Removed: handleAutoUpdate - replaced with aggressive update in handleCampaignImport

  const handleCampaignImport = (selectedCampaignNames: string[], clusters?: Cluster[], metricMapping?: any) => {
    const currentBrand = brands.find(b => b.id === selectedBrand);
    if (!currentBrand) return;
    
    // Get current data
    const currentData = [...currentBrand.campaigns[activeTab].data];
    const currentHeaders = currentData[0] || [];
    
    // Track new metrics that need to be added to the metrics tool
    const newMetricsToAdd = new Set<string>();
    
    // Filter uploaded data to only selected campaigns and apply metric mapping
    const selectedCampaignData = uploadedCampaignData.filter(c => 
      selectedCampaignNames.includes(c.campaignName)
    ).map(campaign => {
      // Apply metric mapping if provided
      if (metricMapping && Object.keys(metricMapping).length > 0) {
        console.log(`🗺️ Applying metric mapping for campaign: "${campaign.campaignName}"`);
        console.log('📋 Original metrics:', Object.keys(campaign.data));
        console.log('🔄 Mapping rules:', metricMapping);
        
        const mappedData = { ...campaign.data };
        let mappingsApplied = 0;
        
        // Apply mappings: rename metrics according to the mapping
        Object.entries(metricMapping).forEach(([uploadedMetric, targetMetric]) => {
          if (targetMetric && targetMetric !== '') {
            // Check if the uploaded metric exists in the data
            if (mappedData[uploadedMetric] !== undefined) {
              const originalValue = mappedData[uploadedMetric];
              
              // Copy the value to the target metric
              mappedData[targetMetric as string] = originalValue;
              
              // Only delete the original if it's different from the target
              if (uploadedMetric !== targetMetric) {
                delete mappedData[uploadedMetric];
              }
              
              mappingsApplied++;
              console.log(`✅ Mapped metric: "${uploadedMetric}" → "${targetMetric}" (value: "${originalValue}")`);
              
              // Always track mapped metrics to ensure they're added to selected metrics
              const currentMetrics = currentBrand.campaigns[activeTab].metrics || DEFAULT_METRICS;
              
              // Always add the target metric to our tracking set
              // This ensures it gets added to selected metrics even if it already exists in ALL_METRICS
              newMetricsToAdd.add(targetMetric as string);
              console.log(`📊 Tracking metric for selection: "${targetMetric}"`);
              
              // Log whether it's new or existing
              if (!ALL_METRICS.includes(targetMetric as string)) {
                console.log(`  → This is a NEW metric (will be added to ALL_METRICS)`);
              } else if (!currentMetrics.includes(targetMetric as string)) {
                console.log(`  → This metric exists but is NOT selected (will be selected)`);
              } else {
                console.log(`  → This metric is already selected (ensuring data is mapped)`);
              }
            } else {
              console.log(`⚠️ No data found for uploaded metric "${uploadedMetric}"`);
            }
          } else if (mappedData[uploadedMetric]) {
            console.log(`⚠️ Skipped mapping "${uploadedMetric}" - no target metric specified`);
          }
        });
        
        console.log(`🎯 Applied ${mappingsApplied} metric mappings for "${campaign.campaignName}"`);
        console.log('📋 Final metrics:', Object.keys(mappedData));
        
        return {
          ...campaign,
          data: mappedData
        };
      }
      
      console.log(`📝 No metric mapping applied for campaign: "${campaign.campaignName}"`);
      return campaign;
    });
    
    // Debug: Log the selectedCampaignData after mapping
    console.log('🎯 Selected campaign data after mapping:');
    selectedCampaignData.forEach(campaign => {
      console.log(`Campaign: ${campaign.campaignName}`);
      console.log('Data keys:', Object.keys(campaign.data));
      console.log('Sample data:', Object.entries(campaign.data).slice(0, 5));
    });
    
    const clustersExist = clusters && clusters.length > 0;
    let finalData: string[][];
    let updatedMetrics = currentBrand.campaigns[activeTab].metrics || DEFAULT_METRICS;
    
    if (isUpdateMode) {
      // UPDATE MODE: AGGRESSIVE update method that works with any data structure
      console.log('🔄 AGGRESSIVE Update mode: Updating selected campaigns');
      console.log('🎯 Target campaigns:', selectedCampaignNames);
      
      finalData = [...currentData];
      let updatedCount = 0;
      
      // AGGRESSIVE METHOD: Search EVERY cell in EVERY row to find campaign names
      selectedCampaignData.forEach(newCampaignData => {
        const campaignName = newCampaignData.campaignName;
        console.log(`\n🔍 AGGRESSIVE SEARCH for campaign: "${campaignName}"`);
        console.log('📝 New data to apply:', newCampaignData.data);
        
        let campaignFoundAndUpdated = false;
        
        // Step 1: Find ALL rows that contain this campaign name in ANY cell
        const campaignRowsFound = [];
        
        for (let rowIndex = 0; rowIndex < finalData.length; rowIndex++) {
          const row = finalData[rowIndex];
          for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const cellValue = row[colIndex];
            if (cellValue === campaignName) {
              campaignRowsFound.push({
                rowIndex,
                colIndex,
                cellValue
              });
              console.log(`📍 Found "${campaignName}" at row ${rowIndex}, col ${colIndex}`);
            }
          }
        }
        
        console.log(`📋 Found ${campaignRowsFound.length} occurrences of "${campaignName}"`);
        
        // Step 2: For each occurrence, update the corresponding data
        campaignRowsFound.forEach(found => {
          const { rowIndex, colIndex } = found;
          console.log(`\n🎯 Processing occurrence at row ${rowIndex}, col ${colIndex}`);
          
          // STRATEGY A: If campaign name is in column 0, assume this row or next row has the data
          if (colIndex === 0) {
            console.log('📊 Strategy A: Campaign name in column 0 - checking this row and next rows');
            
            // Check current row first
            let dataRowToUpdate = rowIndex;
            let attempts = 0;
            const maxAttempts = 5; // Check up to 5 rows after campaign name
            
            while (attempts < maxAttempts && dataRowToUpdate < finalData.length) {
              const candidateRow = finalData[dataRowToUpdate];
              console.log(`🔍 Checking row ${dataRowToUpdate}:`, candidateRow);
              
              // Skip if row is empty or contains only headers
              const isHeaderRow = candidateRow.some(cell => 
                cell && DEFAULT_METRICS.includes(cell.trim())
              );
              const isEmpty = candidateRow.every(cell => !cell || cell.trim() === '');
              const hasOnlyClusterName = candidateRow.filter(cell => cell && cell.trim() !== '').length === 1;
              
              if (!isHeaderRow && !isEmpty && !hasOnlyClusterName) {
                console.log(`✅ Found data row at ${dataRowToUpdate} - attempting update`);
                
                // Try to map and update data in this row
                let updatesApplied = 0;
                
                // METHOD 1: Look for a header row above this data row
                let headerRow = null;
                for (let searchRow = dataRowToUpdate - 1; searchRow >= Math.max(0, dataRowToUpdate - 3); searchRow--) {
                  const potentialHeaderRow = finalData[searchRow];
                  if (potentialHeaderRow && potentialHeaderRow.some(cell => DEFAULT_METRICS.includes(cell))) {
                    headerRow = potentialHeaderRow;
                    console.log(`📋 Found header row at ${searchRow}:`, headerRow);
                    break;
                  }
                }
                
                if (headerRow) {
                  // Update based on header mapping
                  headerRow.forEach((header, headerColIndex) => {
                    if (header && header.trim() !== '' && newCampaignData.data[header] !== undefined) {
                      const oldValue = finalData[dataRowToUpdate][headerColIndex];
                      const newValue = newCampaignData.data[header];
                      finalData[dataRowToUpdate][headerColIndex] = newValue;
                      console.log(`🔄 ${header} (col ${headerColIndex}): "${oldValue}" → "${newValue}"`);
                      updatesApplied++;
                    }
                  });
                } else {
                  // METHOD 2: Use default metrics as fallback
                  console.log('📋 No header row found, using DEFAULT_METRICS as fallback');
                  DEFAULT_METRICS.forEach((metric, metricIndex) => {
                    if (metricIndex < candidateRow.length && newCampaignData.data[metric] !== undefined) {
                      const oldValue = finalData[dataRowToUpdate][metricIndex];
                      const newValue = newCampaignData.data[metric];
                      finalData[dataRowToUpdate][metricIndex] = newValue;
                      console.log(`🔄 ${metric} (col ${metricIndex}): "${oldValue}" → "${newValue}"`);
                      updatesApplied++;
                    }
                  });
                }
                
                if (updatesApplied > 0) {
                  console.log(`✅ Applied ${updatesApplied} updates to row ${dataRowToUpdate}`);
                  campaignFoundAndUpdated = true;
                  updatedCount++;
                }
                break;
              } else {
                console.log(`⏭️ Skipping row ${dataRowToUpdate} (header: ${isHeaderRow}, empty: ${isEmpty}, cluster: ${hasOnlyClusterName})`);
              }
              
              attempts++;
              dataRowToUpdate++;
            }
          } else {
            // STRATEGY B: Campaign name is NOT in column 0, assume THIS row contains the data
            console.log('📊 Strategy B: Campaign name not in column 0 - updating this row');
            
            const currentRow = finalData[rowIndex];
            let updatesApplied = 0;
            
            // Find the most recent header row
            let headerRow = null;
            for (let searchRow = rowIndex - 1; searchRow >= 0; searchRow--) {
              const potentialHeaderRow = finalData[searchRow];
              if (potentialHeaderRow && potentialHeaderRow.some(cell => DEFAULT_METRICS.includes(cell))) {
                headerRow = potentialHeaderRow;
                console.log(`📋 Found header row at ${searchRow}:`, headerRow);
                break;
              }
            }
            
            if (headerRow) {
              // Update based on header mapping
              headerRow.forEach((header, headerColIndex) => {
                if (header && header.trim() !== '' && newCampaignData.data[header] !== undefined && headerColIndex !== colIndex) {
                  const oldValue = finalData[rowIndex][headerColIndex];
                  const newValue = newCampaignData.data[header];
                  finalData[rowIndex][headerColIndex] = newValue;
                  console.log(`🔄 ${header} (col ${headerColIndex}): "${oldValue}" → "${newValue}"`);
                  updatesApplied++;
                }
              });
            } else {
              // Use position-based mapping with DEFAULT_METRICS
              console.log('📋 No header row found, using position-based DEFAULT_METRICS mapping');
              DEFAULT_METRICS.forEach((metric, metricIndex) => {
                if (metricIndex < currentRow.length && metricIndex !== colIndex && newCampaignData.data[metric] !== undefined) {
                  const oldValue = finalData[rowIndex][metricIndex];
                  const newValue = newCampaignData.data[metric];
                  finalData[rowIndex][metricIndex] = newValue;
                  console.log(`🔄 ${metric} (col ${metricIndex}): "${oldValue}" → "${newValue}"`);
                  updatesApplied++;
                }
              });
            }
            
            if (updatesApplied > 0) {
              console.log(`✅ Applied ${updatesApplied} updates to row ${rowIndex}`);
              campaignFoundAndUpdated = true;
              updatedCount++;
            }
          }
        });
        
        if (!campaignFoundAndUpdated) {
          console.log(`⚠️ AGGRESSIVE SEARCH: Campaign "${campaignName}" found but could not be updated`);
        } else {
          console.log(`✅ AGGRESSIVE UPDATE: Successfully updated campaign "${campaignName}"`);
        }
      });
      
      console.log(`\n📊 AGGRESSIVE UPDATE COMPLETE: Updated ${updatedCount} campaigns`);
      
      // For UPDATE mode, also ensure new mapped metrics are added to columns
      if (newMetricsToAdd.size > 0) {
        const currentMetricsUpdate = currentBrand.campaigns[activeTab].metrics || DEFAULT_METRICS;
        let updatedMetricsUpdate = [...currentMetricsUpdate];
        
        // Add new metrics to the metrics list and ALL_METRICS
        newMetricsToAdd.forEach(metric => {
          // Add to ALL_METRICS if not already present
          if (!ALL_METRICS.includes(metric)) {
            ALL_METRICS.push(metric);
            console.log(`📊 UPDATE MODE: Added new metric "${metric}" to ALL_METRICS`);
          }
          
          if (!updatedMetricsUpdate.includes(metric)) {
            updatedMetricsUpdate.push(metric);
            console.log(`✅ UPDATE MODE: Added new metric "${metric}" to metrics list`);
          }
        });
        
        // Expand the data structure to include new metric columns
        if (updatedMetricsUpdate.length > currentMetricsUpdate.length) {
          finalData = finalData.map((row, rowIndex) => {
            const newRow = [...row];
            
            // Ensure row has enough columns for all metrics
            while (newRow.length < updatedMetricsUpdate.length) {
              newRow.push('');
            }
            
            // For header rows, add the metric names
            if (rowIndex === 0 || row.some(cell => DEFAULT_METRICS.includes(cell))) {
              updatedMetricsUpdate.forEach((metric, index) => {
                if (!currentMetricsUpdate.includes(metric)) {
                  newRow[index] = metric;
                }
              });
            } else {
              // For data rows, populate the new metric data
              const campaignNameIndex = currentMetricsUpdate.indexOf('Campaign Name');
              if (campaignNameIndex !== -1 && row[campaignNameIndex]) {
                const campaignName = row[campaignNameIndex];
                const campaignData = selectedCampaignData.find(c => c.campaignName === campaignName);
                
                updatedMetricsUpdate.forEach((metric, index) => {
                  if (!currentMetricsUpdate.includes(metric) && campaignData && campaignData.data[metric]) {
                    newRow[index] = campaignData.data[metric];
                    console.log(`✅ UPDATE MODE: Added data for new metric "${metric}": "${campaignData.data[metric]}"`);
                  }
                });
              }
            }
            
            return newRow;
          });
          
          // Store the updated metrics for later
          updatedMetrics = updatedMetricsUpdate;
        }
      }
      
    } else {
      // UPLOAD MODE: Add new campaigns (original logic)
      console.log('📤 Upload mode: Adding new campaigns');
      
      // Find the row where we should start adding campaign data
      let startRow = 1;
      while (startRow < currentData.length && currentData[startRow].some(cell => cell.trim() !== '')) {
        startRow++;
      }
      
      if (clustersExist) {
      // Debug: Log current headers
      console.log('📋 Current headers in spreadsheet:', currentHeaders);
      console.log('📊 Current selected metrics:', updatedMetrics);
      
      // First, ensure updatedMetrics includes all mapped metrics
      newMetricsToAdd.forEach(metric => {
        if (!updatedMetrics.includes(metric)) {
          updatedMetrics.push(metric);
          console.log(`📊 Added "${metric}" to updatedMetrics for clustered data structure`);
        }
      });
      
      // Group campaigns by cluster
      const clusteredCampaigns = new Map<string, string[]>();
      const unclustered: string[] = [];
      
      selectedCampaignNames.forEach(campaignName => {
        const cluster = clusters.find(c => c.campaigns.includes(campaignName));
        if (cluster) {
          if (!clusteredCampaigns.has(cluster.name)) {
            clusteredCampaigns.set(cluster.name, []);
          }
          clusteredCampaigns.get(cluster.name)!.push(campaignName);
        } else {
          unclustered.push(campaignName);
        }
      });
      
      // Clear existing data and start fresh (no main header when using clusters)
      const newData = [];
      let currentRowIndex = 0;
      
      // Add clustered campaigns
      for (const [clusterName, campaignNames] of clusteredCampaigns.entries()) {
        // Add cluster name row
        const clusterNameRow = new Array(updatedMetrics.length).fill('');
        clusterNameRow[0] = clusterName;
        newData.push(clusterNameRow);
        currentRowIndex++;
        
        // Add header row for this cluster with updated metrics
        const headerRow = [...updatedMetrics];
        newData.push(headerRow);
        currentRowIndex++;
        
        // Add campaigns in this cluster
        campaignNames.forEach(campaignName => {
          const campaignInfo = selectedCampaignData.find(c => c.campaignName === campaignName);
          if (!campaignInfo) return;
          
          const campaignRow = new Array(updatedMetrics.length).fill('');
          
          // Map the campaign data to the correct columns using updatedMetrics
          updatedMetrics.forEach((header, colIndex) => {
            if (header === 'Campaign Name') {
              campaignRow[colIndex] = campaignName;
            } else if (campaignInfo.data[header] !== undefined && campaignInfo.data[header] !== null) {
              campaignRow[colIndex] = campaignInfo.data[header];
              console.log(`📊 Setting data for "${campaignName}" - ${header}: "${campaignInfo.data[header]}"`);
            } else {
              campaignRow[colIndex] = '';
            }
          });
          
          newData.push(campaignRow);
          currentRowIndex++;
        });
        
        // Add empty row after each cluster for separation
        const emptyRow = new Array(updatedMetrics.length).fill('');
        newData.push(emptyRow);
        currentRowIndex++;
      }
      
      // Add unclustered campaigns if any
      if (unclustered.length > 0) {
        unclustered.forEach(campaignName => {
          const campaignInfo = selectedCampaignData.find(c => c.campaignName === campaignName);
          if (!campaignInfo) return;
          
          const campaignRow = new Array(updatedMetrics.length).fill('');
          
          // Map the campaign data to the correct columns using updatedMetrics
          updatedMetrics.forEach((header, colIndex) => {
            if (header === 'Campaign Name') {
              campaignRow[colIndex] = campaignName;
            } else if (campaignInfo.data[header] !== undefined && campaignInfo.data[header] !== null) {
              campaignRow[colIndex] = campaignInfo.data[header];
              console.log(`📊 Setting data for "${campaignName}" - ${header}: "${campaignInfo.data[header]}"`);
            } else {
              campaignRow[colIndex] = '';
            }
          });
          
          newData.push(campaignRow);
          currentRowIndex++;
        });
      }
        
        finalData = newData;
      } else {
        // No clusters - add campaigns normally
        console.log('📋 No clusters - adding campaigns normally');
        console.log('📋 Current headers:', currentHeaders);
        console.log('📊 Updated metrics will be:', updatedMetrics);
        
        // First, ensure updatedMetrics includes all mapped metrics
        newMetricsToAdd.forEach(metric => {
          if (!updatedMetrics.includes(metric)) {
            updatedMetrics.push(metric);
            console.log(`📊 Added "${metric}" to updatedMetrics for data structure`);
          }
        });
        
        // Update the header row with new metrics
        if (currentData.length > 0) {
          currentData[0] = [...updatedMetrics];
        }
        
        selectedCampaignNames.forEach((campaignName, index) => {
          const campaignInfo = selectedCampaignData.find(c => c.campaignName === campaignName);
          if (!campaignInfo) {
            console.log(`⚠️ No campaign info found for: ${campaignName}`);
            return;
          }
          
          console.log(`📝 Processing campaign: ${campaignName}`);
          console.log(`Available data keys:`, Object.keys(campaignInfo.data));
          
          const rowIndex = startRow + index;
          if (rowIndex >= currentData.length) {
            currentData.push(new Array(updatedMetrics.length).fill(''));
          }
          
          // Ensure the row has the correct length for all metrics
          while (currentData[rowIndex].length < updatedMetrics.length) {
            currentData[rowIndex].push('');
          }
          
          // Map the campaign data to the correct columns using updatedMetrics
          updatedMetrics.forEach((header, colIndex) => {
            if (header === 'Campaign Name') {
              currentData[rowIndex][colIndex] = campaignName;
            } else if (campaignInfo.data[header] !== undefined && campaignInfo.data[header] !== null) {
              currentData[rowIndex][colIndex] = campaignInfo.data[header];
              console.log(`📊 Setting data for "${campaignName}" - ${header}: "${campaignInfo.data[header]}"`);
            } else {
              currentData[rowIndex][colIndex] = '';
            }
          });
        });
        
        finalData = currentData;
      }
    } // End of UPLOAD MODE
    
    // Add new mapped metrics to the selected metrics if they're not already there
    const currentMetrics = currentBrand.campaigns[activeTab].metrics || DEFAULT_METRICS;
    
    // Process new metrics for both UPDATE and UPLOAD modes
    // (UPDATE mode might have already added some, but we ensure all are added)
    newMetricsToAdd.forEach(metric => {
      // Add to ALL_METRICS if not already present
      if (!ALL_METRICS.includes(metric)) {
        ALL_METRICS.push(metric);
        console.log(`📊 Added new metric "${metric}" to ALL_METRICS`);
      }
      
      // Add to selected metrics if not already selected
      if (!updatedMetrics.includes(metric)) {
        // Find the right position to insert the metric based on ALL_METRICS order
        const insertIndex = ALL_METRICS.findIndex(m => m === metric);
        const beforeMetrics = ALL_METRICS.slice(0, insertIndex);
        const selectedBeforeMetrics = beforeMetrics.filter(m => updatedMetrics.includes(m));
        const insertPosition = selectedBeforeMetrics.length;
        
        updatedMetrics.splice(insertPosition, 0, metric);
        console.log(`✅ Added metric "${metric}" to selected metrics at position ${insertPosition}`);
      }
    });
    
    // If metrics were added, we need to update the data to include columns for them
    if (newMetricsToAdd.size > 0 && updatedMetrics.length !== currentMetrics.length) {
      console.log('📊 Restructuring data to include new metrics');
      console.log('Current metrics:', currentMetrics);
      console.log('Updated metrics:', updatedMetrics);
      
      // Create a completely new data structure with the updated metrics
      const newFinalData = finalData.map((row, rowIndex) => {
        const newRow = new Array(updatedMetrics.length).fill('');
        
        // First, copy existing data to the new positions
        currentMetrics.forEach((metric, oldIndex) => {
          const newIndex = updatedMetrics.indexOf(metric);
          if (newIndex !== -1 && row[oldIndex] !== undefined) {
            newRow[newIndex] = row[oldIndex];
          }
        });
        
        // Then, add data for the new metrics
        updatedMetrics.forEach((metric, newIndex) => {
          if (!currentMetrics.includes(metric)) {
            // This is a new metric that was mapped
            if (rowIndex === 0 || row.some(cell => DEFAULT_METRICS.includes(cell))) {
              // Header row - set the metric name
              newRow[newIndex] = metric;
            } else {
              // Data row - find the campaign name and get the mapped data
              const campaignNameOldIndex = currentMetrics.indexOf('Campaign Name');
              
              if (campaignNameOldIndex !== -1 && row[campaignNameOldIndex]) {
                const campaignName = row[campaignNameOldIndex];
                
                // Find the campaign data that matches this row
                const campaignData = selectedCampaignData.find(c => c.campaignName === campaignName);
                if (campaignData && campaignData.data[metric]) {
                  newRow[newIndex] = campaignData.data[metric];
                  console.log(`✅ Added data for metric "${metric}" in row ${rowIndex}: "${campaignData.data[metric]}" for campaign "${campaignName}"`);
                }
              }
            }
          }
        });
        
        return newRow;
      });
      
      finalData = newFinalData;
      console.log(`📊 Restructured data to include ${newMetricsToAdd.size} new metrics`);
      console.log('Sample row after restructuring:', finalData[1]);
    }
    
    // Update the brand's campaign data and store uploaded data
    setBrands(brands.map(brand => 
      brand.id === selectedBrand 
        ? {
            ...brand,
            campaigns: {
              ...brand.campaigns,
              [activeTab]: {
                data: finalData,
                metrics: updatedMetrics // Update metrics list with new mapped metrics
              }
            },
            uploadedCampaignData: [
              ...(brand.uploadedCampaignData || []).filter(existing => 
                !selectedCampaignData.some(newData => newData.campaignName === existing.campaignName)
              ),
              ...selectedCampaignData
            ]
          }
        : brand
    ));
    
    setShowCampaignSelection(false);
    setUploadedCampaignData([]);
    setIsUpdateMode(false); // Reset update mode after import
  };

  const handleCellChange = (row: number, col: number, value: any) => {
    const currentBrand = brands.find(b => b.id === selectedBrand);
    if (!currentBrand) return;
    
    const newData = [...currentBrand.campaigns[activeTab].data];
    newData[row][col] = value;
    
    // Update the specific brand's campaign data
    setBrands(brands.map(brand => 
      brand.id === selectedBrand 
        ? {
            ...brand,
            campaigns: {
              ...brand.campaigns,
              [activeTab]: {
                ...brand.campaigns[activeTab],
                data: newData
              }
            }
          }
        : brand
    ));
  };

  // EXCELJS Export function with FULL styling support
  const handleExport = async () => {
    const currentBrand = brands.find(b => b.id === selectedBrand);
    if (!currentBrand) return;

    try {
      console.log('🚀 Starting ExcelJS export with FULL styling...');
      
      // Get current campaign data
      const currentData = currentBrand.campaigns[activeTab].data;
      console.log('📊 Current data:', currentData);
      
      if (currentData.length === 0) {
        alert('No data to export');
        return;
      }

      // Create a new ExcelJS workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Ad Reporting Tool';
      workbook.lastModifiedBy = 'Ad Reporting Tool';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Generate sheet name
      const dateStr = new Date().toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      }).replace(/\//g, '-');
      
      const formattedSheetName = `${activeTab} - ${dateStr}`;
      const worksheet = workbook.addWorksheet(formattedSheetName);
      
      console.log('📚 ExcelJS Workbook and worksheet created');

      // Get selected metrics for formatting detection
      const selectedMetrics = getSelectedMetrics();
      
      // Process data starting from row 7, column C (like FortuneSheet)
      const startRow = 7;
      const startCol = 3; // Column C
      
      currentData.forEach((row, rowIndex) => {
        const excelRow = worksheet.getRow(startRow + rowIndex);
        
        row.forEach((cellValue, colIndex) => {
          const excelCol = startCol + colIndex;
          const cell = excelRow.getCell(excelCol);
          
          // Set cell value
          cell.value = cellValue || '';
          
          // Determine if this is a header/cluster row
          const isHeaderRow = rowIndex === 0 || row.includes('Campaign Name') || 
                             selectedMetrics.some(metric => row.includes(metric));
          
          const isClusterRow = colIndex === 0 && !isHeaderRow && 
                              row.filter(c => c && c.trim() !== '').length === 1 &&
                              !selectedMetrics.includes(cellValue);
          
          const isMetricCell = selectedMetrics.includes(cellValue) || cellValue === 'Campaign Name';
          
          console.log(`🔍 Cell (${startRow + rowIndex}, ${excelCol}): "${cellValue}" - Header: ${isHeaderRow}, Cluster: ${isClusterRow}, Metric: ${isMetricCell}`);
          
          // Apply AGGRESSIVE styling for headers and clusters
          if (isHeaderRow || isClusterRow || isMetricCell) {
            console.log(`🔴 Applying RED styling to: "${cellValue}"`);
            
            // RED BACKGROUND WITH WHITE TEXT
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC00000' } // Red background
            };
            
            cell.font = {
              name: 'Calibri',
              size: 11,
              bold: true,
              color: { argb: 'FFFFFFFF' } // White text
            };
            
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
            
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
            
          } else if (cellValue && cellValue.toString().trim() !== '') {
            console.log(`📝 Applying DEFAULT styling to: "${cellValue}"`);
            
            // DEFAULT DATA CELL STYLING
            cell.font = {
              name: 'Calibri',
              size: 10,
              color: { argb: 'FF000000' } // Black text
            };
            
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'left'
            };
            
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          }
        });
      });
      
      // Set column widths
      worksheet.getColumn(1).width = 8;  // Column A
      worksheet.getColumn(2).width = 8;  // Column B
      worksheet.getColumn(3).width = 25; // Column C (Campaign names)
      worksheet.getColumn(4).width = 12; // Column D
      worksheet.getColumn(5).width = 15; // Column E
      worksheet.getColumn(6).width = 12; // Column F
      worksheet.getColumn(7).width = 10; // Column G
      worksheet.getColumn(8).width = 15; // Column H
      worksheet.getColumn(9).width = 10; // Column I
      worksheet.getColumn(10).width = 10; // Column J
      
      console.log('✅ ExcelJS FULL styling applied to all cells');
      
      // Generate filename
      const brandName = (currentBrand?.name || 'Brand').replace(/[^a-zA-Z0-9]/g, '_');
      const campaignName = activeTab.replace(/[^a-zA-Z0-9]/g, '_');
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${brandName}_${campaignName}_${timestamp}.xlsx`;
      
      console.log('💾 Writing ExcelJS file:', filename);
      
      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ ExcelJS export completed: ${filename} with FULL COLORS AND FONTS!`);
    } catch (error: any) {
      console.error('❌ ExcelJS Export failed:', error);
      console.error('❌ Error details:', error.message, error.stack);
      alert(`❌ Export failed: ${error.message}`);
    }
  };

  const handleRightClick = (e: React.MouseEvent, type: string, target: any) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      target
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (contextMenu.type === 'brand') {
      if (action === 'edit') {
        const brandToEdit = brands.find(b => b.id === contextMenu.target);
        setEditingBrand(brandToEdit || null);
        setBrandName(brandToEdit?.name || '');
        setShowBrandModal(true);
      } else if (action === 'delete') {
        setBrands(brands.filter(b => b.id !== contextMenu.target));
        // If we deleted the selected brand, select the first remaining brand
        if (selectedBrand === contextMenu.target && brands.length > 1) {
          const remainingBrands = brands.filter(b => b.id !== contextMenu.target);
          setSelectedBrand(remainingBrands[0]?.id);
        }
      }
    }
    setContextMenu({ show: false, x: 0, y: 0, type: null, target: null });
  };

  // Helper function to reorder columns in spreadsheet data
  const reorderColumns = (data: string[][], oldMetrics: string[], newMetrics: string[]) => {
    if (data.length === 0) return data;
    
    // Create mapping from old metric position to new metric position
    const columnMapping: { [oldIndex: number]: number } = {};
    
    newMetrics.forEach((metric, newIndex) => {
      const oldIndex = oldMetrics.findIndex(oldMetric => oldMetric === metric);
      if (oldIndex !== -1) {
        columnMapping[oldIndex] = newIndex;
      }
    });
    
    // Reorder each row according to the new metric order
    return data.map(row => {
      const newRow = new Array(newMetrics.length).fill('');
      
      // Map old column positions to new positions
      Object.entries(columnMapping).forEach(([oldIdx, newIdx]) => {
        const oldIndex = parseInt(oldIdx);
        if (row[oldIndex] !== undefined) {
          newRow[newIdx] = row[oldIndex];
        }
      });
      
      return newRow;
    });
  };

  // Handle reordering of metrics
  const handleReorderMetrics = (reorderedMetrics: string[]) => {
    const currentBrand = brands.find(b => b.id === selectedBrand);
    if (!currentBrand) return;
    
    const currentMetrics = currentBrand.campaigns[activeTab]?.metrics || [];
    const currentData = currentBrand.campaigns[activeTab]?.data || [];
    
    // Reorder the columns in the existing data
    const reorderedData = reorderColumns(currentData, currentMetrics, reorderedMetrics);
    
    setBrands(prevBrands => prevBrands.map(brand => 
      brand.id === selectedBrand 
        ? {
            ...brand,
            campaigns: {
              ...brand.campaigns,
              [activeTab]: {
                ...brand.campaigns[activeTab],
                metrics: reorderedMetrics,
                data: reorderedData
              }
            }
          }
        : brand
    ));
  };

  // Handle adding custom metrics
  const handleAddCustomMetric = (customMetric: CustomMetric) => {
    // Add to ALL_METRICS if not already present
    if (!ALL_METRICS.includes(customMetric.name)) {
      ALL_METRICS.push(customMetric.name);
    }
    
    // Automatically select the new custom metric
    toggleMetric(customMetric.name);
  };

  // Metrics configuration functions
  const toggleMetric = (metricName: string) => {
    const currentBrand = brands.find(b => b.id === selectedBrand);
    if (!currentBrand) return;
    
    const currentMetrics = currentBrand.campaigns[activeTab].metrics || DEFAULT_METRICS;
    const currentData = [...currentBrand.campaigns[activeTab].data];
    
    let newMetrics: string[];
    let newData = currentData.map(row => [...row]); // Deep copy
    
    if (currentMetrics.includes(metricName)) {
      // Remove metric - find its index and remove corresponding column data
      const metricIndex = currentMetrics.indexOf(metricName);
      newMetrics = currentMetrics.filter(m => m !== metricName);
      
      // Remove the column data for this metric
      newData = newData.map(row => {
        const newRow = [...row];
        newRow.splice(metricIndex, 1);
        return newRow;
      });
    } else {
      // Add metric - maintain original order from ALL_METRICS
      const tempMetrics = [...currentMetrics, metricName];
      newMetrics = ALL_METRICS.filter(m => tempMetrics.includes(m));
      
      // Find where to insert the new column
      const insertIndex = newMetrics.indexOf(metricName);
      
      // Insert column data at the correct position
      newData = newData.map((row, rowIndex) => {
        const newRow = [...row];
        if (rowIndex === 0) {
          // Header row
          newRow.splice(insertIndex, 0, metricName);
        } else {
          // Data rows - check if we have uploaded data for this metric
          let cellValue = '';
          if (currentBrand.uploadedCampaignData) {
            const campaignNameIndex = currentMetrics.indexOf('Campaign Name');
            if (campaignNameIndex !== -1) {
              const campaignName = row[campaignNameIndex];
              const campaignData = currentBrand.uploadedCampaignData.find(c => c.campaignName === campaignName);
              if (campaignData && campaignData.data[metricName]) {
                cellValue = campaignData.data[metricName];
              }
            }
          }
          newRow.splice(insertIndex, 0, cellValue);
        }
        return newRow;
      });
    }
    
    // Update the brand's campaign data
    setBrands(prevBrands => prevBrands.map(brand => 
      brand.id === selectedBrand 
        ? {
            ...brand,
            campaigns: {
              ...brand.campaigns,
              [activeTab]: {
                data: newData,
                metrics: newMetrics
              }
            }
          }
        : brand
    ));
  };
  
  return (
    <div 
      className="flex h-screen p-6 gap-6" 
      style={{ background: 'linear-gradient(135deg, #FF3534 0%, #FF3534 80%, #FFB84E 100%)' }}
      tabIndex={0}
    >
      {/* Compact Left Navigation Bar */}
      <div className="w-20 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col backdrop-blur-xl">
        {/* Agency Logo */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src={logoNew} alt="Logo" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* Brands List */}
        <div className="flex-1 p-3">
          <div className="space-y-2">
            {brands.map((brand) => (
              <div
                key={brand.id}
                onClick={() => {
                  // If clicking on the currently selected brand, open edit modal
                  if (selectedBrand === brand.id) {
                    const brandToEdit = brands.find(b => b.id === brand.id);
                    setEditingBrand(brandToEdit || null);
                    setBrandName(brandToEdit?.name || '');
                    setShowBrandModal(true);
                  } else {
                    // Otherwise, just select the brand
                    setSelectedBrand(brand.id);
                  }
                }}
                onContextMenu={(e) => handleRightClick(e, 'brand', brand.id)}
                className="p-2 cursor-pointer transition-all duration-200 flex justify-center"
                title={selectedBrand === brand.id ? `Edit ${brand.name}` : brand.name}
              >
                <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                  ) : (
                    <FolderOpen className="w-7 h-7 text-gray-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Brand Button */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={() => {
              setEditingBrand(null);
              setBrandName('');
              setTempLogo(null);
              setShowBrandModal(true);
            }}
            className="w-full h-12 flex items-center justify-center border border-dashed border-gray-300/80 rounded-xl hover:border-red-400/60 hover:bg-red-50/60 transition-all duration-200"
            title="Add Brand"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Excel Frame */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden backdrop-blur-xl">
        {/* Top Header */}
        <div className="bg-white/80 border-b border-gray-100 p-3 rounded-t-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 font-dm-sans">
                {brands.find(b => b.id === selectedBrand)?.name} Reports
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleExport}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-dm-sans text-sm"
              >
                <Download className="w-3 h-3 inline mr-1" />
                Export
              </button>
              <button
                onClick={() => {
                  console.log('🔄 Update Campaigns button clicked');
                  setIsUpdateMode(true);
                  console.log('🔄 Update mode set to true');
                  xlsxInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-dm-sans text-sm"
              >
                <Edit3 className="w-3 h-3 inline mr-1" />
                Update Campaigns
              </button>
              
              <button
                onClick={() => {
                  setIsUpdateMode(false);
                  xlsxInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-dm-sans text-sm"
              >
                <Upload className="w-3 h-3 inline mr-1" />
                Upload Campaign
              </button>
              
              <button
                onClick={() => setShowLoadDialog(true)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-dm-sans text-sm disabled:opacity-50"
              >
                <FolderOpen className="w-3 h-3 inline mr-1" />
                {isLoading ? 'Loading...' : 'Load Campaign'}
              </button>
              
              <button
                onClick={() => setShowSaveAsDialog(true)}
                disabled={isSaving}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-dm-sans text-sm disabled:opacity-50"
              >
                <Database className="w-3 h-3 inline mr-1" />
                {isSaving ? 'Saving...' : 'Save Campaign'}
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Tabs */}
        <div className="bg-white/80 border-b border-gray-100 backdrop-blur-sm relative z-10">
          <div className="flex items-center justify-between px-3">
            <div className="flex-1 flex items-center overflow-hidden">
              {/* Scrollable tabs container */}
              <div className="flex space-x-1 items-center overflow-x-auto scrollbar-hide py-2 pr-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {campaigns.map((campaign) => (
                <div
                  key={campaign}
                  className={`group relative px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 font-dm-sans flex items-center whitespace-nowrap ${
                    activeTab === campaign
                      ? 'bg-red-50/80 text-red-600 border border-red-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  {editingCampaign === campaign ? (
                    <input
                      type="text"
                      value={editingCampaignName}
                      onChange={(e) => setEditingCampaignName(e.target.value)}
                      onBlur={() => {
                        if (editingCampaignName.trim()) {
                          const newCampaigns = campaigns.map(c => c === campaign ? editingCampaignName.trim() : c);
                          setCampaigns(newCampaigns);
                          // Update the active tab if it was the one being edited
                          if (activeTab === campaign) {
                            setActiveTab(editingCampaignName.trim());
                          }
                          // Update brands state to reflect campaign name change
                          setBrands(brands.map(brand => 
                            brand.id === selectedBrand 
                              ? {
                                  ...brand,
                                  campaigns: Object.fromEntries(
                                    Object.entries(brand.campaigns).map(([key, value]) => 
                                      key === campaign ? [editingCampaignName.trim(), value] : [key, value]
                                    )
                                  )
                                }
                              : brand
                          ));
                        }
                        setEditingCampaign(null);
                        setEditingCampaignName('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                          setEditingCampaign(null);
                          setEditingCampaignName('');
                        }
                      }}
                      className="bg-transparent border-none outline-none text-sm font-medium w-full min-w-[80px]"
                      autoFocus
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveTab(campaign)}
                        className="text-xs font-medium mr-1"
                      >
                        {campaign}
                      </button>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setEditingCampaignName(campaign);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit campaign name"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => {
                            const currentBrand = brands.find(b => b.id === selectedBrand);
                            if (currentBrand && currentBrand.campaigns[campaign]) {
                              const campaignData = currentBrand.campaigns[campaign];
                              const copyName = `${campaign} Copy`;
                              const newCampaigns = [...campaigns, copyName];
                              setCampaigns(newCampaigns);
                              setActiveTab(copyName); // Switch to the new copied campaign
                              
                              // Add copied campaign to brands state
                              setBrands(brands.map(brand => 
                                brand.id === selectedBrand 
                                  ? {
                                      ...brand,
                                      campaigns: {
                                        ...brand.campaigns,
                                        [copyName]: {
                                          data: campaignData.data.map(row => [...row]), // Deep copy
                                          metrics: [...campaignData.metrics] // Copy metrics
                                        }
                                      }
                                    }
                                  : brand
                              ));
                            }
                          }}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Copy campaign"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (campaigns.length > 1) {
                              setShowDeleteConfirm(campaign);
                            } else {
                              alert('You must have at least one campaign');
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              </div>
              
              {/* Add Campaign Button */}
              <button
                onClick={() => {
                  const currentBrand = brands.find(b => b.id === selectedBrand);
                  if (currentBrand) {
                    const newCampaignNumber = campaigns.length + 1;
                    const newCampaignName = `Campaign ${newCampaignNumber}`;
                    
                    // Create default campaign data
                    const defaultCampaignData = () => {
                      const initialData = [];
                      for (let i = 0; i < 20; i++) {
                        const row = [];
                        for (let j = 0; j < DEFAULT_METRICS.length; j++) {
                          if (i === 0) {
                            row.push(DEFAULT_METRICS[j]);
                          } else {
                            row.push('');
                          }
                        }
                        initialData.push(row);
                      }
                      return initialData;
                    };
                    
                    // Add new campaign
                    const newCampaigns = [...campaigns, newCampaignName];
                    setCampaigns(newCampaigns);
                    setActiveTab(newCampaignName); // Switch to the new campaign
                    
                    // Update brands state
                    setBrands(brands.map(brand => 
                      brand.id === selectedBrand 
                        ? {
                            ...brand,
                            campaigns: {
                              ...brand.campaigns,
                              [newCampaignName]: {
                                data: defaultCampaignData(),
                                metrics: [...DEFAULT_METRICS]
                              }
                            }
                          }
                        : brand
                    ));
                  }
                }}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200"
                title="Add new campaign"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <div className="flex items-center relative z-20">
              <MetricsAutocomplete
                allMetrics={ALL_METRICS}
                selectedMetrics={selectedMetrics}
                onToggleMetric={toggleMetric}
                onReorderMetrics={handleReorderMetrics}
                onAddCustomMetric={handleAddCustomMetric}
                placeholder="Search metrics..."
              />
            </div>
          </div>
        </div>


        {/* FortuneSheet Spreadsheet Area */}
        <div className="flex-1 bg-white">
          <FortuneSheetComponent
            key={`${selectedBrand}-${activeTab}-${selectedMetrics.join(',')}`}
            data={memoizedSpreadsheetData}
            onCellChange={handleCellChange}
            metrics={selectedMetrics}
            workbookRef={workbookRef}
            campaignName={activeTab}
          />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'brand' && (
            <>
              <button
                onClick={() => handleContextMenuAction('edit')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Brand
              </button>
              <button
                onClick={() => handleContextMenuAction('delete')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Brand
              </button>
            </>
          )}
        </div>
      )}

      {/* Brand Upload Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 w-96 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              {editingBrand ? 'Edit Brand' : 'Add New Brand'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Logo
                </label>
                <div className="border-2 border-dashed border-gray-300/80 rounded-xl p-6 text-center hover:border-red-400/60 transition-all duration-200">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleBrandUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {(editingBrand?.logo || tempLogo) ? (
                    <div className="mb-4">
                      <img src={editingBrand?.logo || tempLogo || ''} alt="Brand logo" className="w-16 h-16 mx-auto rounded-lg object-cover mb-2" />
                      <p className="text-xs text-gray-500">{editingBrand ? 'Current logo' : 'Uploaded logo'}</p>
                    </div>
                  ) : null}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{editingBrand ? 'Change logo' : 'Click to upload logo'}</p>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200"
                  placeholder="Enter brand name"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBrandModal(false);
                  setEditingBrand(null);
                  setBrandName('');
                  setTempLogo(null); // Reset temporary logo
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Require brand name for both new and existing brands
                  if (!brandName.trim()) {
                    alert('Please enter a brand name');
                    return;
                  }
                  
                  if (editingBrand) {
                    // Update existing brand name (logo already handled in handleBrandUpload)
                    setBrands(brands.map(brand => 
                      brand.id === editingBrand.id 
                        ? { ...brand, name: brandName.trim() }
                        : brand
                    ));
                  } else {
                    // Create new brand - require name, use temporary logo if available
                    const defaultCampaignData = () => {
                      const initialData = [];
                      for (let i = 0; i < 20; i++) {
                        const row = [];
                        for (let j = 0; j < DEFAULT_METRICS.length; j++) {
                          if (i === 0) {
                            row.push(DEFAULT_METRICS[j]);
                          } else {
                            row.push('');
                          }
                        }
                        initialData.push(row);
                      }
                      return initialData;
                    };
                    
                    const newBrand = {
                      id: Date.now(),
                      name: brandName.trim(),
                      logo: tempLogo, // Use temporarily stored logo
                      campaigns: {
                        'Campaign 1': { data: defaultCampaignData(), metrics: [...DEFAULT_METRICS] }
                      }
                    };
                    setBrands([...brands, newBrand]);
                  }
                  
                  // Reset modal state
                  setShowBrandModal(false);
                  setEditingBrand(null);
                  setBrandName('');
                  setTempLogo(null);
                }}
                disabled={!brandName.trim()} // Disable button if no name entered
                className={`px-4 py-2 rounded-xl transition-all duration-200 shadow-sm ${
                  !brandName.trim() 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {editingBrand ? 'Update Brand' : 'Add Brand'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Campaign Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 w-96 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 font-dm-sans">
              Delete Campaign
            </h3>
            <p className="text-sm text-gray-600 mb-6 font-dm-sans">
              Are you sure you want to delete "{showDeleteConfirm}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-dm-sans"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const campaignToDelete = showDeleteConfirm;
                  const newCampaigns = campaigns.filter(c => c !== campaignToDelete);
                  setCampaigns(newCampaigns);
                  
                  // Switch to first remaining campaign if we're deleting the active one
                  if (activeTab === campaignToDelete && newCampaigns.length > 0) {
                    setActiveTab(newCampaigns[0]);
                  }
                  
                  // Remove campaign from brands state
                  setBrands(brands.map(brand => 
                    brand.id === selectedBrand 
                      ? {
                          ...brand,
                          campaigns: Object.fromEntries(
                            Object.entries(brand.campaigns).filter(([key]) => key !== campaignToDelete)
                          )
                        }
                      : brand
                  ));
                  
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 shadow-sm font-dm-sans"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={xlsxInputRef}
        onChange={handleXlsxUpload}
        accept=".xlsx,.xls,.csv"
        multiple
        className="hidden"
      />

      {/* Campaign Selection Modal */}
      <CampaignSelectionModal
        isOpen={showCampaignSelection}
        onClose={() => {
          setShowCampaignSelection(false);
          setUploadedCampaignData([]);
          setIsUpdateMode(false); // Reset update mode when closing modal
        }}
        campaignData={uploadedCampaignData}
        onConfirm={handleCampaignImport}
        isUpdateMode={isUpdateMode}
        existingCampaigns={getCurrentExistingCampaigns()}
        availableMetrics={getSelectedMetrics()}
      />

      {/* Save As Dialog */}
      {showSaveAsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Campaign</h3>
            <input
              type="text"
              value={saveAsNewName}
              onChange={(e) => setSaveAsNewName(e.target.value)}
              placeholder="Enter campaign name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSaveAsDialog(false);
                  setSaveAsNewName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveCampaign(saveAsNewName, true)}
                disabled={!saveAsNewName.trim() || isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Campaign Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Load Campaign</h3>
            {isLoading ? (
              <div className="text-center py-8">Loading campaigns...</div>
            ) : savedCampaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No saved campaigns found</div>
            ) : (
              <div className="space-y-2 mb-4">
                {savedCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    onClick={() => handleLoadCampaign(campaign)}
                  >
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(campaign.created_at || '').toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Metrics: {campaign.metrics.length} | Rows: {campaign.data.length}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this campaign?')) {
                          CampaignService.deleteCampaign(campaign.id!).then(() => {
                            loadSavedCampaigns();
                          }).catch(() => {
                            alert('Failed to delete campaign');
                          });
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdReportingTool;