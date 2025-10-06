function createChart(){
  const type = chartTypeSelect.value;
  const year1 = year1Select.value;
  const year2 = year2Select.value;
  const selectedSectors = getSelectedSectors();

  const ctx = document.getElementById('energyChart').getContext('2d');
  if(energyChart) energyChart.destroy();

  let datasets = [];

  // Año 1
  datasets.push(...selectedSectors.map((s,i)=>({
    label: `${s} (${year1})`,
    data: getDataForYear(year1, selectedSectors)[i],
    backgroundColor: colors[i],
    borderColor: colors[i],
    borderWidth:1,
    fill: false,
    tension: 0.3 // suaviza líneas en chart line
  })));

  // Año 2 (comparación)
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
    data:{
      labels: selectedSectors,
      datasets: datasets
    },
    options:{
      responsive:true,
      animation:{
        duration:800,
        easing:'easeInOutCubic'
      },
      plugins:{
        tooltip:{
          mode:'nearest',
          intersect:false,
          callbacks:{
            label: function(context){
              return `${context.dataset.label}: ${context.raw}%`;
            }
          }
        },
        legend:{display:true, position:'bottom'}
      },
      onClick: (evt,elements)=>{
        if(elements.length){
          const el = elements[0];
          showDetails(el.datasetIndex);
        }
      },
      scales:type==='pie'?{}:{
        y:{beginAtZero:true,title:{display:true,text:'%'}},
        x:{title:{display:true,text:'Sectores'}}
      }
    }
  });

  // Actualizar texto de detalles con animación de fade
  details.style.opacity = 0;
  setTimeout(()=> {
    details.textContent = `Visualizando año(s): ${year1}${year2? ' y '+year2:''}. Sectores seleccionados: ${selectedSectors.join(', ')}.`;
    details.style.transition = 'opacity 0.5s';
    details.style.opacity = 1;
  }, 200);
}
