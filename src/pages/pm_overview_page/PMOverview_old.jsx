import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import './PMOverview.css';
import ApexChart from 'react-apexcharts';


const PMOverview = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState([]);
    const [data2, setData2] = useState([]);

  const [uniqueProjects, setUniqueProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("Funding Cancer 2024")
  const [selectedManager, setSelectedManager] = useState(null);
  const [comparisonSelection, setComparisonSelection] = useState([]);
  const [projectUserPieData, setProjectUserPieData] = useState({ labels: [], series: [] });
  const [visibilityFilter, setVisibilityFilter] = useState('Total');
   const [chartData, setChartData] = useState({ labels: [], series: [] });


  // useEffect(() => {
  //   if (submitted) fetchData();
  // }, [submitted]);

  const fetchData = async () => {
  try {
    const res = await axios.get('http://localhost:5000/summary', {
      params: { startdate: startDate, enddate: endDate, filter: visibilityFilter },
    });

    const filtered = res.data.filter(entry => entry.username !== 'ADMINISTRATOR');
    const normalized = filtered.map(d => ({ ...d, duration: parseInt(d.duration) / 3600 }));
    setData(normalized);

    // Extract unique project names
    const uniqueProjectNames = [...new Set(normalized.map(d => d.project_name))];
    setUniqueProjects(uniqueProjectNames);

  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
};


  useEffect(() => {
  if (!selectedProject || data.length === 0) return;

  const filtered = data.filter(d => d.project_name === selectedProject);

  const totalHours = filtered.reduce((sum, d) => sum + d.duration, 0);

  const labels = filtered.map(d => d.username);
  const series = filtered.map(d => ((d.duration / totalHours) * 100).toFixed(2));

  setProjectUserPieData({ labels, series });

}, [selectedProject, data]);




  const managerOptions = [...new Set(data.map(d => d.username))].map(name => ({ label: name, value: name }));



  useEffect(() => {
  if (startDate && endDate && visibilityFilter) {
    fetchData();
    setSubmitted(true);
    fetchData2()
    
  }
}, [startDate, endDate, visibilityFilter,selectedProject]);
 
const pieData = () => {
  const grouped = data.reduce((acc, cur) => {
    if (!acc[cur.username]) acc[cur.username] = new Set();
    acc[cur.username].add(cur.project_name);
    return acc;
  }, {});

  const entries = Object.entries(grouped)
    .map(([username, projects]) => ({
      username,
      count: projects.size,
      projects: Array.from(projects)
    }))
    .sort((a, b) => b.count - a.count); // 🔽 Sort DESC

  return {
    labels: entries.map(e => e.username),
    series: entries.map(e => e.count),
    projectLists: entries.map(e => e.projects)
  };
};

const pieChart = pieData();



  const fetchData2 = async () => {
            console.log("here is the selecte project:",selectedProject)

    try {
      const res = await axios.get('http://localhost:5000/user-project-hours', {
        params: {projectName: selectedProject, startdate: startDate, enddate: endDate,filter: visibilityFilter },
      });
      // const filtered = res.data.filter(entry => entry.username !== 'ADMINISTRATOR');
      // setData2(filtered.map(d => ({ ...d, duration: parseInt(d.duration) / 3600 })));
      // console.log("Fetch data2",filtered)

      console.log("here is the",res)

    const labels = res.map((item) => item.username);
    const series = res.map((item) => parseFloat(item.total_hours));
      
    setChartData({ labels, series });


    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };


//////////pie chart data2

  // useEffect(() => {
  //   // Simulate API response
  //   const response = [
  //     { username: "Ippokratis Geranakis", total_hours: "74.0000" },
  //     { username: "Zampetakis Ilias", total_hours: "48.0000" },
  //     { username: "Antonis Palios", total_hours: "21.0000" },
  //   ];
    


  // }, [])





///////////////////////////////////////////

  const selectedData = data.filter(d => d.username === selectedManager);
  // const selectedProjects = [...new Set(selectedData.map(d => d.project_name))];

  const comparisonTargets = comparisonSelection.includes('All')
    ? [...new Set(data.map(d => d.username))]
    : comparisonSelection;

  const comparisonBarData = () => {
    const datasets = comparisonTargets.map((manager, index) => {
      const subset = data.filter(d => d.username === manager);
      return {
        label: manager,
        data: subset.map(p => p.duration),
        backgroundColor: `hsl(${index * 60}, 70%, 60%)`
      };
    });

    const allProjects = [...new Set(data.flatMap(d => d.project_name))];

    return {
      labels: allProjects,
      datasets
    };
  };

  

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h2>Φίλτρο Επισκόπησης Project Managers</h2>
        <div className="flex gap-4 items-end">
          <Calendar
            value={startDate}
            onChange={(e) => setStartDate(e.value)}
            showIcon
            className="w-full md:w-56"
          />
          <Calendar
            value={endDate}
            onChange={(e) => setEndDate(e.value)}
            showIcon
            className="w-full md:w-56"
          />
          <Dropdown
            value={visibilityFilter}
            options={[
              { label: "Total", value: "Total" },
              { label: "Active Only", value: "Active" },
              { label: "Inactive Only", value: "Inactive" },
            ]}
            onChange={(e) => setVisibilityFilter(e.value)}
            className=" md:w-56"
          />

          <Button
            label="Submit"
            onClick={() => {
              fetchData();
              setSubmitted(true);
            }}
            className="p-button-info"
          />
        </div>
      </div>

      {submitted && data.length > 0 && (
        <>
          <div className="card">
            <h3>Σύνολο δεδομένων</h3>
            <DataTable
              value={data}
              paginator
              rows={10}
              stripedRows
              responsiveLayout="scroll"
            >
              <Column field="username" header="Project Manager" />
              <Column field="project_name" header="Project Name" />
              <Column field="duration" header="Duration (h)" />
              <Column field="budget" header="Budget" />
              <Column
                field="visible"
                header="Visible"
                body={(row) => (row.visible ? "Yes" : "No")}
              />
            </DataTable>
          </div>

          <div className="card">
            <h3>Επισκόπηση Project Management</h3>
            <ApexChart
              options={{
                labels: pieChart.labels,
                legend: { position: "bottom" },
                tooltip: {
                  custom: function ({ seriesIndex, w }) {
                    const name = w?.globals?.labels?.[seriesIndex];
                    const projects = pieChart.projectLists[seriesIndex] || [];
                    return (
                      `<div style="padding:8px">` +
                      `<strong>${name}</strong><br>` +
                      projects.map((p) => `• ${p}`).join("<br>") +
                      `<br><em>Total Projects: ${projects.length}</em>` +
                      `</div>`
                    );
                  },
                },
                dataLabels: {
                  enabled: true,
                  formatter: function (val) {
                    return `${val.toFixed(1)}%`;
                  },
                },
              }}
              series={pieChart.series}
              type="pie"
              width="700"
              height="400"
            />
          </div>

          <div className="card">
            <h3>Επιλέξτε Project Manager από τη λίστα</h3>
            <Dropdown
              value={selectedManager}
              options={managerOptions}
              onChange={(e) => setSelectedManager(e.value)}
              placeholder="Select Manager"
              className="w-full md:w-72"
              filter
            />

            {selectedManager && selectedData.length > 0 && (
              <ApexChart
                type="bar"
                height={400}
                options={{
                  chart: {
                    id: "manager-duration-bar",
                    toolbar: { show: false },
                  },
                  plotOptions: {
                    bar: {
                      horizontal: false,
                      columnWidth: "50%",
                    },
                  },
                  xaxis: {
                    categories: selectedData.map((d) => d.project_name),
                    title: { text: "Project" },
                  },
                  yaxis: {
                    title: { text: "Hours" },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: (val) => `${val.toFixed(1)}h`,
                  },
                  tooltip: {
                    y: {
                      formatter: (val) => `${val.toFixed(1)} hours`,
                    },
                  },
                  colors: ["#2b6cb0"],
                  legend: { show: false },
                }}
                series={[
                  {
                    name: "Duration (h)",
                    data: selectedData.map((d) => parseFloat(d.duration)),
                  },
                ]}
              />
            )}

            {/* {selectedProjects.length > 0 && (
              <TabView>
                {selectedProjects.map((proj, i) => (
                  <TabPanel header={proj} key={i}>
                    <p><strong>Project:</strong> {proj}</p>
                  </TabPanel>
                ))}
              </TabView>
            )} */}
          </div>



        <div className='card'>
            <h3>Επιλέξτε Project από τη λίστα</h3>

             <Dropdown
              value={selectedProject}
              options={uniqueProjects.map((name) => ({
                label: name,
                value: name,
              }))}
              onChange={(e) => setSelectedProject(e.value)}
              placeholder="Select Project"
              className="w-full md:w-72"
            />
         <ApexChart
        type="pie"
        width="600"
        options={{
          labels: chartData.labels,
          legend: { position: "right" },
          tooltip: {
            y: {
              formatter: (val) => `${val.toFixed(2)} hours`,
            },
          },
          dataLabels: {
            enabled: true,
            formatter: (val, opts) => {
              const label = opts.w.globals.labels[opts.seriesIndex];
              return `${label}: ${val.toFixed(1)}%`;
            },
          },
        }}
        series={chartData.series}
      />
    
        </div>

       



          {/* <div className="card">
            <h3>Σύγκριση Project Managers</h3>
            <MultiSelect
              value={comparisonSelection}
              options={[...managerOptions, { label: "All", value: "All" }]}
              onChange={(e) => setComparisonSelection(e.value)}
              placeholder="Select managers"
              display="chip"
              className="w-full md:w-96"
            />

            <Chart
              type="bar"
              data={comparisonBarData()}
              options={{
                plugins: { legend: { position: "top" } },
                responsive: true,
                scales: {
                  x: {
                    stacked: true,
                    title: { display: true, text: "Project" },
                  },
                  y: {
                    stacked: true,
                    title: { display: true, text: "Duration (h)" },
                  },
                },
              }}
              style={{
                maxWidth: "1000px",
                height: "500px",
                margin: "2rem auto",
              }}
            />
         
          </div> */}
        </>
      )}
    </div>
  );
};

export default PMOverview;