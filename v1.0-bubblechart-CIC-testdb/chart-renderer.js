/**
 * Chart Renderer Module
 * Handles Google Charts bubble chart rendering
 */

let chart = null;
let currentChartData = null;
let currentOptions = null;
let googleChartsReady = false;

// Load Google Charts and set up callback
google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(() => {
  googleChartsReady = true;
  console.log('Google Charts loaded successfully');
});

/**
 * Draw bubble chart
 * @param {number} year - Selected year
 * @param {number} pollutantId - Selected pollutant ID
 * @param {Array} groupIds - Array of selected group IDs
 */
function drawBubbleChart(year, pollutantId, groupIds) {
  // Wait for Google Charts to be ready
  if (!googleChartsReady) {
    console.log('Google Charts not ready yet, waiting...');
    google.charts.setOnLoadCallback(() => {
      googleChartsReady = true;
      drawBubbleChart(year, pollutantId, groupIds);
    });
    return;
  }

  // Get data points
  const dataPoints = window.supabaseModule.getScatterData(year, pollutantId, groupIds);
  console.log('Chart renderer: got', dataPoints.length, 'data points');
  if(dataPoints.length > 0) {
    console.log('First data point:', dataPoints[0]);
  }
  
  if (dataPoints.length === 0) {
    console.error('No data points returned!');
    showMessage('No data available for the selected year, pollutant, and groups.', 'error');
    return;
  }

  // Prepare Google DataTable for scatter chart with bubble-like styling
  const data = new google.visualization.DataTable();
  data.addColumn('number', 'Activity Data (TJ)');
  data.addColumn('number', `${window.supabaseModule.getPollutantName(pollutantId)} (${window.supabaseModule.getPollutantUnit(pollutantId)})`);
  data.addColumn({type: 'string', role: 'tooltip'});
  data.addColumn({type: 'string', role: 'style'});

  // Add data rows with emission factor calculation and sizing
  console.log('Adding', dataPoints.length, 'rows to bubble-style scatter chart data');
  
  // Calculate all EF values first to determine dynamic scale factor
  const allEFs = dataPoints.map(p => p.EF !== undefined ? p.EF : (p.activityData !== 0 ? (p.pollutantValue / p.activityData) * 1000000 : 0));
  const maxEF = Math.max(...allEFs);
  const minEF = Math.min(...allEFs.filter(ef => ef > 0)); // Exclude zeros
  
  // Smart dynamic scaling:
  // 1. Try to scale so max bubble is 90px
  // 2. If that would make min bubble < 5px, scale so min bubble is 5px instead
  const targetMaxRadius = 90;
  const targetMinRadius = 5;
  
  let scaleFactor = targetMaxRadius / Math.sqrt(maxEF);
  const minRadiusWithMaxScale = scaleFactor * Math.sqrt(minEF);
  
  if (minRadiusWithMaxScale < targetMinRadius) {
    // Min would be too small, so scale based on min instead
    scaleFactor = targetMinRadius / Math.sqrt(minEF);
    console.log(`Dynamic scaling: Using MIN-based scaling (min would be ${minRadiusWithMaxScale.toFixed(2)}px)`);
  } else {
    console.log(`Dynamic scaling: Using MAX-based scaling (min will be ${minRadiusWithMaxScale.toFixed(2)}px)`);
  }
  
  console.log(`maxEF=${maxEF.toFixed(2)}, minEF=${minEF.toFixed(2)}, scaleFactor=${scaleFactor.toFixed(2)}`);
  
  dataPoints.forEach((point, index) => {
    const color = window.Colors.getColorForGroup(point.groupName);
    const pollutantUnit = window.supabaseModule.getPollutantUnit(pollutantId);

    // Use Emission Factor (EF) directly for bubble size
    // If EF is already provided in point, use it; otherwise, calculate as before
    const emissionFactor = point.EF !== undefined ? point.EF : (point.activityData !== 0 ? (point.pollutantValue / point.activityData) * 1000000 : 0);

    // Calculate bubble size based on EF with square root scaling
    // This compresses the range so both large and small EF values are visible
    // while still maintaining proportional representation
    const sqrtEF = Math.sqrt(emissionFactor);
    const radius = scaleFactor * sqrtEF;
    
    // Use calculated radius directly - no minimum or maximum constraints
    const normalizedRadius = radius;

    // Debug logging for first few points
    if (index < 3) {
      console.log(`Point ${index}: ${point.groupName}, EF=${emissionFactor.toFixed(2)}, sqrtEF=${sqrtEF.toFixed(2)}, radius=${radius.toFixed(2)}, normalized=${normalizedRadius.toFixed(2)}`);
    }

    const tooltip = `${point.groupName}\nActivity: ${point.activityData.toLocaleString()} TJ\nEmissions: ${point.pollutantValue.toLocaleString()} ${pollutantUnit}\nEmission Factor: ${emissionFactor.toFixed(2)}`;

    data.addRow([
      point.activityData, // X-axis
      point.pollutantValue, // Y-axis
      tooltip,
      `point {fill-color: ${color}; size: ${Math.round(normalizedRadius)};}`
    ]);
  });
  
  console.log('Chart data rows added, now drawing chart...');

  // Chart options
  const pollutantName = window.supabaseModule.getPollutantName(pollutantId);
  const pollutantUnit = window.supabaseModule.getPollutantUnit(pollutantId);
  const activityUnit = window.supabaseModule.getPollutantUnit(window.supabaseModule.activityDataId);
  
  console.log('Chart renderer - Pollutant Name:', pollutantName);
  console.log('Chart renderer - Pollutant Unit:', pollutantUnit);
  console.log('Chart renderer - Activity Unit:', activityUnit);
  
  // Format title and axis labels for bubble chart
  const chartTitle = `${pollutantName} - ${pollutantUnit}`;
  const yAxisTitle = `${pollutantName} (${pollutantUnit})`;
  const xAxisTitle = activityUnit ? `Activity Data (${activityUnit})` : 'Activity Data (TJ)';

  // Create a custom title element with two lines
  const chartTitleElement = document.getElementById('chartTitle');
  if (chartTitleElement) {
    chartTitleElement.style.display = 'block';
    chartTitleElement.style.textAlign = 'center';
    chartTitleElement.style.marginBottom = '10px';

    // Add year as the first line
    const yearElement = document.createElement('div');
    yearElement.style.fontSize = '28px';
    yearElement.style.fontWeight = 'bold';
    yearElement.textContent = `${year}`;

    // Add pollutant and emission unit as the second line
    const pollutantElement = document.createElement('div');
    pollutantElement.style.fontSize = '20px';
    pollutantElement.textContent = `${yAxisTitle}`;

    // Clear previous content and append new elements
    chartTitleElement.innerHTML = '';
    chartTitleElement.appendChild(yearElement);
    chartTitleElement.appendChild(pollutantElement);
  }

  // Calculate dynamic height based on window size
  const chartHeight = Math.max(500, window.innerHeight * 0.8);

  const chartDiv = document.getElementById('chart_div');
  if (!chartDiv) {
    console.error('Missing #chart_div element');
    showMessage('Chart container not found', 'error');
    return;
  }

  // Prepare colors for each group
  const colors = [];
  const uniqueGroups = [...new Set(dataPoints.map(point => point.groupName))];
  uniqueGroups.forEach(groupName => {
    colors.push(window.Colors.getColorForGroup(groupName));
  });

  // Calculate axis ranges with padding for bubbles
  const activityValues = dataPoints.map(p => p.activityData);
  const pollutantValues = dataPoints.map(p => p.pollutantValue);
  
  const maxActivity = Math.max(...activityValues);
  const maxPollutant = Math.max(...pollutantValues);
  
  // Add extra padding to prevent bubble clipping (bubbles need radius space)
  const activityPadding = maxActivity * 0.25;
  const pollutantPadding = maxPollutant * 0.25;
  
  // Get minimum values to add left/bottom padding
  const minActivity = Math.min(...activityValues);
  const minPollutant = Math.min(...pollutantValues);
  
  // Calculate minimum offsets (ensure bubbles don't start at the very edge)
  const activityMinOffset = Math.max(0, minActivity - (maxActivity * 0.05));
  const pollutantMinOffset = Math.max(0, minPollutant - (maxPollutant * 0.05));

  currentOptions = {
    legend: { position: 'none' }, // Remove Google Chart legend
    title: '', // Invisible Google Chart title
    titleTextStyle: {
      fontSize: 0 // Minimize title space
    },
    chartArea: {
      top: 80,
      bottom: 120,
      left: 150,
      right: 80,
      height: '60%'
    },
    height: chartHeight,
    hAxis: {
      title: xAxisTitle,
      format: 'short',
      gridlines: {
        count: 5
      },
      titleTextStyle: {
        italic: false
      },
      viewWindow: {
        min: 0,
        max: maxActivity + activityPadding
      }
    },
    vAxis: {
      title: yAxisTitle,
      viewWindow: {
        min: 0,
        max: maxPollutant + pollutantPadding
      }
    },
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal',
      keepInBounds: true,
      maxZoomIn: 4.0
    },
    colors: colors,
    colorAxis: {
      legend: {
        position: 'none'
      }
    }
  };

  // Store current chart data for export
  currentChartData = {
    data: data,
    options: currentOptions,
    year: year,
    pollutantId: pollutantId,
    pollutantName: pollutantName,
    groupIds: groupIds,
    dataPoints: dataPoints
  };

  // Draw chart using ScatterChart with bubble-like styling to avoid clipping
  if (!chart) {
    chart = new google.visualization.ScatterChart(chartDiv);

    // Add listener for chart render completion (for loading management)
    google.visualization.events.addListener(chart, 'ready', () => {
      console.log('Google Charts ready event fired!');
      if (window.chartRenderCallback) {
        window.chartRenderCallback();
        window.chartRenderCallback = null; // Clear callback after use
      }
    });
    
    // Add error listener
    google.visualization.events.addListener(chart, 'error', (err) => {
      console.error('Google Charts error:', err);
    });
  }
  
  try {
    chart.draw(data, currentOptions);
    console.log('chart.draw() completed without error');

    // Create custom legend after chart is drawn
    createCustomLegend(chart, data, groupIds, dataPoints);
  } catch (err) {
    console.error('Error calling chart.draw():', err);
  }
  
  // Show chart with animation (add visible class to wrapper, not chart_div)
  const chartWrapper = document.querySelector('.chart-wrapper');
  if (chartWrapper) {
    chartWrapper.classList.add('visible');
  }
  
  // Enable share and download buttons
  const shareBtnEl = document.getElementById('shareBtn');
  const downloadBtnEl = document.getElementById('downloadBtn');
  if (shareBtnEl) shareBtnEl.disabled = false;
  if (downloadBtnEl) downloadBtnEl.disabled = false;

  clearMessage();
}

/**
 * Create a custom legend for the scatter chart
 * @param {Object} chart - Google Chart instance
 * @param {Object} data - Google DataTable instance
 * @param {Array} groupIds - Array of selected group IDs
 */
function createCustomLegend(chart, data, groupIds, dataPoints) {
  const legendContainer = document.getElementById('customLegend');
  if (!legendContainer) {
    console.error('Missing #customLegend element');
    return;
  }

  legendContainer.innerHTML = ''; // Clear existing legend
  legendContainer.style.display = 'flex';
  legendContainer.style.justifyContent = 'center';
  legendContainer.style.flexWrap = 'wrap';
  legendContainer.style.gap = '10px';

  groupIds.forEach((groupId, index) => {
    const groupName = dataPoints[index].groupName; // Get group name from dataPoints array

    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.style.display = 'flex';
    legendItem.style.alignItems = 'center';
    legendItem.style.cursor = 'pointer';
    legendItem.style.fontWeight = 'bold';
    legendItem.style.margin = '1px';

    const colorCircle = document.createElement('span');
    colorCircle.style.backgroundColor = window.Colors.getColorForGroup(groupName);
    colorCircle.style.width = '12px';
    colorCircle.style.height = '12px';
    colorCircle.style.borderRadius = '50%';
    colorCircle.style.marginRight = '8px';

    const label = document.createElement('span');
    label.textContent = groupName;

    legendItem.appendChild(colorCircle);
    legendItem.appendChild(label);

    legendItem.addEventListener('click', () => {
      const series = chart.getOption('series');
      series[index].visibleInLegend = !series[index].visibleInLegend;
      chart.setOption('series', series);
      chart.draw(data, currentOptions);
    });

    legendContainer.appendChild(legendItem);
  });
}

/**
 * Show a status message
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'error', 'warning', 'info'
 */
function showMessage(message, type = 'info') {
  let messageDiv = document.getElementById('statusMessage');
  if (!messageDiv) {
    messageDiv = document.createElement('div');
    messageDiv.id = 'statusMessage';
    const chartWrapper = document.querySelector('.chart-wrapper');
    chartWrapper.parentNode.insertBefore(messageDiv, chartWrapper);
  }
  
  messageDiv.className = `status-message ${type}`;
  messageDiv.textContent = message;
  messageDiv.style.display = 'block';
}

/**
 * Clear status message
 */
function clearMessage() {
  const messageDiv = document.getElementById('statusMessage');
  if (messageDiv) {
    messageDiv.style.display = 'none';
  }
}

/**
 * Get current chart data for export
 * @returns {Object} Current chart data
 */
function getCurrentChartData() {
  return currentChartData;
}

/**
 * Get chart instance
 * @returns {Object} Google Chart instance
 */
function getChartInstance() {
  return chart;
}

// Export chart renderer functions
window.ChartRenderer = {
  drawBubbleChart,
  showMessage,
  clearMessage,
  getCurrentChartData,
  getChartInstance
};
