import React, { useEffect } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';

interface FortuneSheetComponentProps {
  data: any[];
  onCellChange?: (row: number, col: number, value: any) => void;
  metrics: string[];
  workbookRef?: React.RefObject<any>;
  campaignName?: string;
}

const FortuneSheetComponent: React.FC<FortuneSheetComponentProps> = ({
  data,
  onCellChange,
  metrics,
  workbookRef,
  campaignName = "Campaign"
}) => {
  // Calculate optimal column width based on actual text content
  const calculateColumnWidth = (columnData: string[], header: string = '') => {
    if (columnData.length === 0) return 80;
    
    // Create a canvas to measure text width accurately
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 80;
    
    // Set the font to match FortuneSheet's font
    ctx.font = '10px "DM Sans", sans-serif';
    
    // Measure all cell contents including header
    const allTexts = [header, ...columnData.filter(cell => cell && cell.trim() !== '')];
    let maxWidth = 0;
    
    allTexts.forEach(text => {
      if (text && text.trim() !== '') {
        const textWidth = ctx.measureText(String(text)).width;
        maxWidth = Math.max(maxWidth, textWidth);
      }
    });
    
    // Add padding (20px total: 10px each side) and ensure minimum width
    const calculatedWidth = Math.max(60, Math.min(300, maxWidth + 20));
    
    // Clean up
    canvas.remove();
    
    return Math.round(calculatedWidth);
  };

  // Convert your existing data structure to FortuneSheet format
  const convertToFortuneSheetData = (rawData: string[][]) => {
    const cellData: any[] = [];
    
    // Starting position: C7 (row index 6, column index 2)
    const START_ROW = 6; // Row 7 (0-indexed)
    const START_COL = 2; // Column C (0-indexed: A=0, B=1, C=2)
    
    rawData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell !== '') {
          // Adjust positions to start from C7
          const adjustedRow = START_ROW + rowIndex;
          const adjustedCol = START_COL + colIndex;
          
          // Check if this is a cluster row (first cell contains text and is not a metric header)
          const isClusterRow = colIndex === 0 && rowIndex > 0 && 
                              !metrics.includes(cell) && 
                              row.filter(c => c.trim() !== '').length === 1;
          
          // Check if this is a metric header row
          const isMetricRow = rowIndex === 0 || 
                             (row.includes('Campaign Name') && metrics.some(m => row.includes(m)));
          
          const cellStyle: any = {};
          
          if (isClusterRow || isMetricRow) {
            // Apply stats headline style
            cellStyle.bg = '#c00000';
            cellStyle.fc = '#FFFFFF';
            cellStyle.bl = 1; // Bold
            cellStyle.ht = 1; // Horizontal align center
            cellStyle.vt = 0; // Vertical align middle
            cellStyle.className = 'stats-headline'; // Add class name
          }
          
          cellData.push({
            r: adjustedRow,
            c: adjustedCol,
            v: {
              v: cell,
              ct: { fa: "General", t: "g" },
              ff: "DM Sans", // Set font family
              fs: 10, // Font size (7pt = 10px in FortuneSheet)
              ...cellStyle
            }
          });
        }
      });
    });

    // Calculate dynamic column widths based on actual content
    const maxCols = Math.max(...rawData.map(row => row.length));
    const columnWidths: { [key: number]: number } = {};
    
    // Get headers for reference
    const headers = rawData.length > 0 ? rawData[0] : [];
    
    // Set widths for columns starting from C (index 2)
    for (let colIndex = 0; colIndex < maxCols; colIndex++) {
      const columnData = rawData.slice(1).map(row => row[colIndex] || ''); // Skip header row
      const adjustedColIndex = START_COL + colIndex;
      const header = headers[colIndex] || '';
      
      // Calculate width based on actual text content
      const calculatedWidth = calculateColumnWidth(columnData, header);
      
      console.log(`📏 Column ${colIndex} ("${header}"): ${calculatedWidth}px`);
      columnWidths[adjustedColIndex] = calculatedWidth;
    }


    return [{
      name: `${campaignName} / ${new Date().toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      }).replace(/\//g, '-')}`, // Campaign name / today's date
      status: 1,
      order: 0,
      row: Math.max(50, START_ROW + rawData.length + 10),
      column: Math.max(50, START_COL + maxCols + 10), // Allow more columns for auto-sizing
      celldata: cellData,
      config: {
        merge: {},
        borderInfo: [],
        rowlen: {},
        columnlen: columnWidths,
        rowhidden: {},
        colhidden: {},
        customHeight: {},
        customWidth: {},
        // Add currency configuration
        currency: "USD",
        defaultCurrency: "USD",
        // Default font configuration
        defaultFontFamily: "DM Sans",
        defaultFontSize: 10
      },
      scrollLeft: 0,
      scrollTop: 0,
      luckysheet_select_save: [],
      calcChain: [],
      isPivotTable: false,
      pivotTable: {},
      filter_select: { row: [], column: [] },
      filter: undefined,
      luckysheet_alternateformat_save: [],
      luckysheet_alternateformat_save_modelCustom: [],
      luckysheet_conditionformat_save: [],
      frozen: undefined as any,
      chart: [],
      zoomRatio: 1,
      image: [],
      showGridLines: true,
      dataVerification: {},
      // Additional currency settings
      currency: "USD",
      defaultCurrency: "USD",
      locale: "en-US"
    }];
  };

  // Use useMemo to regenerate when data or metrics change
  const fortuneSheetData = React.useMemo(() => {
    return convertToFortuneSheetData(data);
  }, [data, metrics]);


  // Force override FortuneSheet fonts and currency after component mounts
  useEffect(() => {
    const overrideDefaults = () => {
      // Override the default font configurations
      if (window.luckysheet && window.luckysheet.fontarray) {
        window.luckysheet.fontarray = [
          { "fontFamily": "DM Sans", "name": "DM Sans" },
          { "fontFamily": "Poppins", "name": "Poppins" },
          { "fontFamily": "Montserrat", "name": "Montserrat" },
          { "fontFamily": "Arial", "name": "Arial" }
        ];
      }
      
      // Set default font
      if (window.luckysheet && window.luckysheet.defaultFont) {
        window.luckysheet.defaultFont = "DM Sans";
        window.luckysheet.defaultFontFamily = "DM Sans";
      }

      // Set default currency to USD
      if (window.luckysheet) {
        window.luckysheet.defaultCurrency = "USD";
        window.luckysheet.currency = "USD";
        
        // Override currency format
        if (window.luckysheet.config) {
          window.luckysheet.config.defaultCurrency = "USD";
          window.luckysheet.config.currency = "USD";
          window.luckysheet.config.defaultFontFamily = "DM Sans";
        }
      }
      
      // Fix scrolling issues first
      const fixScrolling = () => {
        // Ensure FortuneSheet containers have proper overflow settings
        const containers = document.querySelectorAll('.fortune-sheet-container, .luckysheet-grid-container');
        containers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.style.setProperty('overflow', 'visible', 'important');
          }
        });
        
        // Ensure scrollbars are functional
        const scrollbars = document.querySelectorAll('.luckysheet-scrollbar-ltr');
        scrollbars.forEach(scrollbar => {
          if (scrollbar instanceof HTMLElement) {
            scrollbar.style.setProperty('overflow', 'auto', 'important');
            scrollbar.style.setProperty('position', 'absolute', 'important');
          }
        });
        
        // Fix horizontal scrollbar specifically
        const horizontalScrollbar = document.querySelector('.luckysheet-scrollbar-x');
        if (horizontalScrollbar instanceof HTMLElement) {
          horizontalScrollbar.style.setProperty('overflow-x', 'auto', 'important');
          horizontalScrollbar.style.setProperty('height', '17px', 'important');
        }
        
        // Fix vertical scrollbar specifically  
        const verticalScrollbar = document.querySelector('.luckysheet-scrollbar-y');
        if (verticalScrollbar instanceof HTMLElement) {
          verticalScrollbar.style.setProperty('overflow-y', 'auto', 'important');
          verticalScrollbar.style.setProperty('width', '17px', 'important');
        }
      };
      
      // Apply scrolling fixes
      fixScrolling();
      
      // Auto-resize columns based on content
      const autoResizeColumns = () => {
        // Try to access FortuneSheet API for auto-resizing
        if (window.luckysheet && window.luckysheet.getSheet) {
          try {
            const sheetData = window.luckysheet.getSheet();
            if (sheetData && sheetData.config && sheetData.config.columnlen) {
              console.log('🔄 Auto-resizing columns based on content...');
              
              // Force FortuneSheet to recalculate column widths
              if (window.luckysheet.refreshCanvas) {
                window.luckysheet.refreshCanvas();
              }
              
              // Try to trigger auto column width
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const event = new Event('resize');
                window.dispatchEvent(event);
              }
            }
          } catch (error) {
            console.log('Auto-resize not available, using calculated widths');
          }
        }
      };
      
      // Apply auto-resize
      autoResizeColumns();
      
      // Force update all cells to use DM Sans - AGGRESSIVE
      const cellSelectors = [
        '.luckysheet-cell-main div',
        '.luckysheet-cell-main span', 
        '.luckysheet-cell-main',
        '.luckysheet-cell',
        '.luckysheet-cell-content',
        '.luckysheet-cell-input',
        '.luckysheet-wa-editor',
        '.luckysheet-input-box',
        '.luckysheet-input-box-inner',
        '.luckysheet-cell-input',
        '[contenteditable="true"]',
        'div[data-type="cell"]',
        '.fortune-sheet div[role="gridcell"]',
        '.fortune-sheet [class*="cell"]',
        '.luckysheet-grid-cell',
        'div[style*="position: absolute"]'
      ];
      
      cellSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.setProperty('font-family', 'DM Sans, sans-serif', 'important');
            element.style.setProperty('font-size', '10px', 'important');
          }
        });
      });
      
      // Override any new input elements
      const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
      inputs.forEach(input => {
        if (input instanceof HTMLElement) {
          input.style.setProperty('font-family', 'DM Sans, sans-serif', 'important');
          input.style.setProperty('font-size', '10px', 'important');
        }
      });
      
      // Override canvas font rendering - AGGRESSIVE
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        const ctx = (canvas as HTMLCanvasElement).getContext('2d');
        if (ctx) {
          // Store original methods
          const originalFillText = ctx.fillText;
          const originalStrokeText = ctx.strokeText;
          const originalMeasureText = ctx.measureText;
          
          // Override fillText
          ctx.fillText = function(text: string, x: number, y: number, maxWidth?: number) {
            this.font = this.font.replace(/^[^\s,]+/, '10px "DM Sans"');
            if (!this.font.includes('DM Sans')) {
              this.font = '10px "DM Sans", sans-serif';
            }
            return originalFillText.call(this, text, x, y, maxWidth);
          };
          
          // Override strokeText
          ctx.strokeText = function(text: string, x: number, y: number, maxWidth?: number) {
            this.font = this.font.replace(/^[^\s,]+/, '10px "DM Sans"');
            if (!this.font.includes('DM Sans')) {
              this.font = '10px "DM Sans", sans-serif';
            }
            return originalStrokeText.call(this, text, x, y, maxWidth);
          };
          
          // Override measureText
          ctx.measureText = function(text: string) {
            this.font = this.font.replace(/^[^\s,]+/, '10px "DM Sans"');
            if (!this.font.includes('DM Sans')) {
              this.font = '10px "DM Sans", sans-serif';
            }
            return originalMeasureText.call(this, text);
          };
          
          // Set default font immediately
          ctx.font = '10px "DM Sans", sans-serif';
        }
      });
      
      // Intercept any dynamic canvas creation
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName: string) {
        const element = originalCreateElement.call(this, tagName);
        if (tagName.toLowerCase() === 'canvas') {
          setTimeout(() => {
            const ctx = (element as HTMLCanvasElement).getContext('2d');
            if (ctx) {
              ctx.font = '10px "DM Sans", sans-serif';
            }
          }, 0);
        }
        return element;
      };
    };

    // Run immediately and after delays to ensure FortuneSheet is loaded
    overrideDefaults();
    setTimeout(() => { overrideDefaults(); autoResizeColumns(); }, 100);
    setTimeout(() => { overrideDefaults(); autoResizeColumns(); }, 500);
    setTimeout(() => { overrideDefaults(); autoResizeColumns(); }, 1000);
    setTimeout(() => { overrideDefaults(); autoResizeColumns(); }, 2000);
    
    // Also run on any DOM changes - AGGRESSIVE MONITORING
    const observer = new MutationObserver((mutations) => {
      let shouldOverride = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if it's a FortuneSheet related element
              if (element.classList?.contains('luckysheet-cell-main') ||
                  element.classList?.contains('luckysheet-cell') ||
                  element.classList?.contains('fortune-sheet') ||
                  element.querySelector?.('.luckysheet-cell-main') ||
                  element.tagName?.toLowerCase() === 'canvas') {
                shouldOverride = true;
              }
            }
          });
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target as Element;
          if (element.classList?.contains('luckysheet-cell-main') ||
              element.classList?.contains('luckysheet-cell')) {
            shouldOverride = true;
          }
        }
      });
      
      if (shouldOverride) {
        // Use setTimeout to avoid infinite loops
        setTimeout(() => {
          overrideDefaults();
          fixScrolling(); // Also apply scrolling fixes when DOM changes
          autoResizeColumns(); // Auto-resize when content changes
        }, 0);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    return () => observer.disconnect();
  }, []);


  return (
    <div className="w-full h-full relative overflow-hidden">
      <Workbook
        data={fortuneSheetData}
        lang="en"
        allowEdit={true}
        showToolbar={true}
        showSheetTabs={true}
        showFormulaBar={true}
        enableAddRow={true}
        enableAddColumn={true}
        allowInsertRow={true}
        allowInsertColumn={true}
        allowDeleteRow={true}
        allowDeleteColumn={true}
        ref={workbookRef}
        options={{
          container: 'luckysheet',
          title: 'Ad Reporting Tool',
          lang: 'en',
          allowEdit: true,
          enableAddRow: true,
          enableAddColumn: true,
          showsheetbar: true,
          showstatisticBar: true,
          allowInsertRow: true,
          allowInsertColumn: true,
          allowDeleteRow: true,
          allowDeleteColumn: true,
          // Optimized scrolling configuration with auto-sizing
          scrollbars: true,
          scrollbarX: true,
          scrollbarY: true,
          overflow: 'auto',
          rowHeaderWidth: 46,
          colHeaderHeight: 20,
          columnHeaderHeight: 20,
          rowlen: {},
          columnlen: {},
          defaultColWidth: 80,
          defaultRowHeight: 19,
          // Enable auto column width adjustment
          autoColumnWidth: true,
          autoRowHeight: false
        }}
        onChange={(data: any) => {
          // Handle cell changes
          if (onCellChange && data && data.length > 0) {
            const sheet = data[0];
            if (sheet && sheet.celldata) {
              // The onChange provides the entire sheet data
              // We could process it to find what changed if needed
              console.log('Sheet data changed');
            }
          }
        }}
      />
    </div>
  );
};

export default FortuneSheetComponent;