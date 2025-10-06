let dataset = [];
const sectors = [];
const colors = [
  'rgba(37,99,235,0.9)',
  'rgba(16,185,129,0.9)',
  'rgba(234,88,12,0.9)',
  'rgba(168,85,247,0.9)',
  'rgba(244,63,94,0.9)',
  'rgba(250,204,21,0.9)'
];

const year1Select = document.getElementById('year1-select');
const year2Select = document.getElementById('year2-select');
const chartTypeSelect = document.getElementById('chart-type');
const sectorFiltersDiv = document.getElementById('sector-filters');
const details = document.getElementById('details');
const downloadBtn = document.getElementById('download-csv');

let energyChart = null;

// 🔹 Cargar datos desde data.json usando ruta relativa para GitHub Pages
fetch('./data.json')
  .then(resp => resp.json())
  .then(data => {
    dataset = data;
    Object.keys(data[0]).forEach(k => { if(k !== 'year') sectors.push(k); });
    initControls();
    createChart();
  })
  .catch(err => console.error("Error cargando datos:", err));

function initControls(){
  dataset.forEach(d=>{
    const opt1 = document.createElement('option');
    opt1.value = d.year; opt1.textContent = d.year;
    year1Select.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = d.year; opt2.textContent = d.year;
    year2Select.appendChild(opt2);
  });

  year1Select.value = dataset[dataset.length-1].year;

  sectors.forEach((s,i)=>{
    const label = document.createElement('label');
    label.style.marginRight = '8px';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = s;
    cb.checked = true;
    cb.addEventListener('change', createChart);
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' '+s));
    sectorFiltersDiv.appendChild(label);
  });

  year1Select.addEventListener('change', createChart);
  year2Select.addEventListener('change', createChart);
  chartTypeSelect.addEventListener('change', createChart);
  downloadBtn.addEventListener('click', downloadCSV);
}

function getSelectedSectors(){
  return Array.from(sectorFiltersDiv.querySelectorAll('input:checked')).map(cb=>cb.value);
}

function getDataForYear(year, selectedSectors){
  const row = dataset.find(r=>r.year === Number(year));
  return selectedSectors.map(s => row[s]);
}

function createChart(){
  const type = chartTypeSelect.value;
  const year1 = year1Select.value;
  const year2 = year2Select.value;
  const selectedSectors = getSelectedSectors();

  const ctx = document.getElementById('energyChart').getContext('2d');
  if(energyChart) energyChart.destroy();

  let datasets = [];

  datasets.push(...selectedSectors.map((s,i)=>({
    label: `${s} (${year1})`,
    data: getDataForYear(year1, selectedSectors)[i],
    backgroundColor: colors[i],
    borderColor: colors[i],
    borderWidth:1,
    fill: false,
    tension: 0.3
  })));

  if(year2){
    datasets.push(...selectedSectors.map((s,i)=>({
      label: `${s} (${year2})`,
      data: getDataForYear(year2, selectedSectors)[i],
      backgroundColor: colors[i].replace('0.9','0.5'),
      borderColor: colors[i].replace('0.9','0.5'),
      borderWidth:1,
      fill: false,
      tension: 0.3
    })));
  }

  energyChart = new Chart(ctx,{
    type: type==='pie'?'pie':type,
    data:{ labels: selectedSectors, datasets: datasets },
    options:{
      responsive:true,
      animation:{ duration:800, easing:'easeInOutCubic' },
      plugins:{
        tooltip:{
          mode:'nearest', intersect:false,
          callbacks:{ label: function(context){ return `${context.dataset.label}: ${context.raw}%`; } }
        },
        legend:{display:true, position:'bottom'}
      },
      onClick: (evt,elements)=>{ if(elements.length){ const el = elements[0]; showDetails(el.datasetIndex); } },
      scales:type==='pie'?{}:{y:{beginAtZero:true,title:{display:true,text:'%'}}, x:{title:{display:true,text:'Sectores'}}}
    }
  });

  details.style.opacity = 0;
  setTimeout(()=> {
    details.textContent = `Visualizando año(s): ${year1}${year2? ' y '+year2:''}. Sectores seleccionados: ${selectedSectors.join(', ')}.`;
    details.style.transition = 'opacity 0.5s';
    details.style.opacity = 1;
  }, 200);
}

function showDetails(idx){
  const ds = energyChart.data.datasets[idx];
  details.textContent = `${ds.label} tiene ${ds.data} % de consumo.`;
}

function downloadCSV(){
  const selectedSectors = getSelectedSectors();
  const years = [year1Select.value, year2Select.value].filter(Boolean);
  const headers = ['year', ...selectedSectors];
  const rows = dataset.filter(d => years.includes(d.year.toString())).map(d => [d.year, ...selectedSectors.map(s=>d[s])]);
  const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'consumo_energetico.csv';
  a.click();
  URL.revokeObjectURL(url);
}
