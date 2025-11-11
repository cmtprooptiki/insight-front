import React, { useEffect, useState } from 'react';
import axios from 'axios';
import apiBaseUrl from '../../apiConfig';
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
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState([]);

  const [uniqueProjects, setUniqueProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedManager, setSelectedManager] = useState(null);
  const [visibilityFilter, setVisibilityFilter] = useState('Total');
  const [chartData, setChartData] = useState({ labels: [], series: [] });
  const [pmOptions, setPmOptions] = useState([]); // all managers
  const [selectedPMs, setSelectedPMs] = useState([]); // selected
  const [pmBarChartData, setPmBarChartData] = useState({ labels: [], series: [] });



  // useEffect(() => {
  //   if (submitted) fetchData();
  // }, [submitted]);

  const fetchData = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/summary`, {
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
  if (selectedProject && startDate && endDate && visibilityFilter) {
    fetchUserProjectHours();
        console.log("Here are the data",chartData)

  }
}, [selectedProject, startDate, endDate, visibilityFilter]);

const [pmSummaryRaw, setPmSummaryRaw] = useState([]);

const fetchPmSummary = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/stack-bar`, {
      params: {
        startdate: startDate,
        enddate: endDate,
        filter: visibilityFilter,
      },
    });

    setPmSummaryRaw(res.data);

    // extract unique PMs
    const uniqueManagers = [
      ...new Set(res.data.map((d) => d.username)),
    ].map((name) => ({ label: name, value: name }));
    setPmOptions(uniqueManagers);

  } catch (error) {
    console.error("Error fetching PM summary", error);
  }
};

useEffect(() => {
  if (selectedPMs.length && pmSummaryRaw.length) {
    const filtered = pmSummaryRaw.filter((d) =>
      selectedPMs.includes(d.username)
    );

    const allProjects = [
      ...new Set(filtered.map((item) => item.project_name)),
    ];

    const series = allProjects.map((project) => ({
      name: project,
      data: selectedPMs.map((pm) => {
        const match = filtered.find(
          (d) => d.username === pm && d.project_name === project
        );
        return match ? parseFloat(match.total_hours) : 0;
      }),
    }));

    setPmBarChartData({
      labels: selectedPMs,
      series,
    });
  } else {
    setPmBarChartData({ labels: [], series: [] });
  }
}, [selectedPMs, pmSummaryRaw]);


const fetchUserProjectHours = async () => {
  console.log("user project running fetcg")
  if (!selectedProject) return;

  try {
    const res = await axios.get(`${apiBaseUrl}/user-project-hours`, {
      params: {
        projectName: selectedProject,
        startdate: startDate,
        enddate: endDate,
        filter: visibilityFilter,
      },
    });

    const labels = res.data.map((item) => item.username);
    const series = res.data.map((item) => parseFloat(item.total_hours));

    console.log("Fetched Chart Data:", { labels, series }); // Debug
    setChartData({ labels, series });
  } catch (error) {
    console.error("Failed to fetch user project hours:", error);
  }
};

const totalProjectHours = chartData.series.reduce((sum, val) => sum + val, 0).toFixed(2);


  const managerOptions = [...new Set(data.map(d => d.username))].map(name => ({ label: name, value: name }));



  useEffect(() => {
  if (startDate && endDate && visibilityFilter) {
    fetchData();
    setSubmitted(true);
    fetchPmSummary();
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



  




  const selectedData = data.filter(d => d.username === selectedManager);



  

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
              <div>
              <h3>Συνολικές ωρες για κάθε Project για τον Project Manager {selectedManager}</h3>
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
                    labels: {
                          formatter: (val) => `${val.toFixed(1)}`,  // This ensures 1 decimal place
                      },
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
              </div>
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
              onChange={(e) => {
                setSelectedProject(e.value); 
                setChartData({ labels: [], series: [] });}} // clear old data}}
              placeholder="Select Project"
              className="w-full md:w-72"
            />
            
            {chartData.series.length > 0 && (
              <div>
              <h3>Ποσοστό Συνολικών ωρών για το Project {selectedProject}</h3>
    <ApexChart
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
            return `${label}: ${val.toFixed(2)}%`;
          },
        },
      }}
      series={chartData.series}
      type="pie"
      width="600"
      height="400"
    />
    </div>
  )}

  {/* KPI Panel */}
      <div className="bg-gray-100 p-6 rounded-2xl shadow-md min-w-[200px] text-center">
        <p className="text-lg font-semibold mb-2">Συνολικές Ώρες Ομάδας</p>
        <p className="text-3xl font-bold text-blue-600">{totalProjectHours}h</p>
      </div>

  <div className="card">
  <h3>Σύγκριση Συνολικών Ωρων ομάδας μεταξυ των επιλεγμένων Project Managers</h3>
  <MultiSelect
    value={selectedPMs}
    options={managerOptions}
    onChange={(e) => setSelectedPMs(e.value)}
    placeholder="Select Project Managers"
    display="chip"
    className="w-full md:w-96"
  />
</div>

{pmBarChartData.series.length > 0 && (
  <ApexChart
    type="bar"
    height={400}
    options={{
      chart: {
        stacked: true,
        toolbar: { show: true },
      },
      xaxis: {
        categories: pmBarChartData.labels,
        title: { text: "Project Managers" },
      },
      yaxis: {
        title: { text: "Total Hours" },
      },
      legend: { position: "top" },
      tooltip: {
        y: { formatter: (val) => `${val.toFixed(1)} hours` },
      },
    }}
    series={pmBarChartData.series}
  />
)}


       
    
        </div>

       



       
        </>
      )}
    </div>
  );
};

export default PMOverview;