import React, { useEffect, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import './Home.css';
import apiBaseUrl from '../apiConfig';

const Home = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [comparisonManagers, setComparisonManagers] = useState([]);

  useEffect(() => {
    if (!submitted) return;
    getSummary();
  }, [submitted]);

  const getSummary = async () => {
    try {
        const response = await axios.get(`${apiBaseUrl}/summary`);
        const filtered = response.data.filter(entry => entry.username !== 'ADMINISTRATOR');
        setData(filtered.map(d => ({ ...d, duration: parseInt(d.duration) / 3600 })));
      } 
    catch (error) {
      console.log("Custom error message: Failed to fetch user history");
      if (error.response && error.response.status === 403) 
        {
          alert("Access denied! Please contact an administrator.");
        } 
        else
        {
          console.log("An error occurred:", error.message);
        }
    }
  };

  const managerOptions = [...new Set(data.map(d => d.username))].map(manager => ({
    label: manager,
    value: manager
  }));

  const pieData = Object.entries(
    data.reduce((acc, curr) => {
      if (!acc[curr.username]) acc[curr.username] = { count: 0, projects: [] };
      acc[curr.username].count += 1;
      acc[curr.username].projects.push(curr.project_name);
      return acc;
    }, {})
  );

  const selectedManagerData = data.filter(d => d.username === selectedManager);
  const projectNames = selectedManagerData.map(p => p.project_name);
  const projectDurations = selectedManagerData.map(p => p.duration);
  const managersToCompare = comparisonManagers.length > 0 ? comparisonManagers : managerOptions.map(o => o.value);

  return (
    <div className="main-container">
      <div className="card enhanced-card">
        <h2 className="card-title">🎯 Φιλτράρισμα Εφαρμογής</h2>
        <div className="filter-section">
          <Calendar value={startDate} onChange={(e) => setStartDate(e.value)} showIcon className="calendar-input" />
          <Calendar value={endDate} onChange={(e) => setEndDate(e.value)} showIcon className="calendar-input" />
          <Button label="Submit" onClick={() => setSubmitted(true)} className="p-button-raised p-button-info text-white shadow-md" />
        </div>
      </div>

      {data.length !== 0 && (
        <>
          <div className="card enhanced-card">
            <h2 className="card-title">📄 Σύνολο δεδομένων</h2>
            <DataTable value={data} paginator rows={10} stripedRows showGridlines responsiveLayout="scroll">
              <Column field="username" header="Project Manager" sortable></Column>
              <Column field="project_name" header="Project Name" sortable></Column>
              <Column field="duration" header="Duration (hours)" sortable></Column>
              <Column field="time_budget" header="Time Budget" sortable></Column>
              <Column field="active" header="Visible" body={(rowData) => (rowData.active ? 'Yes' : 'No')} sortable></Column>
            </DataTable>
          </div>

          <div className="card enhanced-card">
            <h2 className="card-title">📊 Επισκόπηση Project Manager</h2>
            <Plot
              data={[
                {
                  type: 'pie',
                  values: pieData.map(([_, v]) => v.count),
                  labels: pieData.map(([k]) => k),
                  text: pieData.map(([_, v]) => v.projects.join('<br>')),
                  hoverinfo: 'label+text+value+percent',
                  textinfo: 'percent+label',
                }
              ]}
              layout={{ title: 'Projects per Manager' }}
            />
          </div>

          <div className="card enhanced-card">
            <h2 className="card-title">🧑‍💼 Επιλέξτε Project Manager</h2>
            <Dropdown
              value={selectedManager}
              options={managerOptions}
              onChange={(e) => setSelectedManager(e.value)}
              placeholder="Select a Manager"
              className="custom-dropdown w-full md:w-80"
            />
          </div>

          {selectedManager && (
            <div className="card enhanced-card">
              <h3 className="card-subtitle">📈 Projects for {selectedManager}</h3>
              <Plot
                data={[
                  {
                    type: 'bar',
                    x: projectNames,
                    y: projectDurations,
                    marker: { color: 'teal' }
                  }
                ]}
                layout={{ title: `Project Durations for ${selectedManager}` }}
              />

              {/* <TabView>
                {selectedManagerData.map((proj, idx) => (
                  <TabPanel header={typeof proj.project_name === 'string' ? proj.project_name : 'Unnamed'} key={idx}>
                    <div className="space-y-2">
                      <p><strong>📌 Project ID:</strong> {proj.project_id}</p>
                      <p><strong>⏱ Duration (h):</strong> {(proj.duration).toFixed(2)}</p>
                      <p><strong>💰 Budget:</strong> {proj.time_budget}</p>
                      <p><strong>👁️ Visible:</strong> {proj.active ? 'Yes' : 'No'}</p>
                    </div>
                  </TabPanel>
                ))}
              </TabView> */}
            </div>
          )}

          <div className="card enhanced-card">
            <h2 className="card-title">📉 Σύγκριση Project Managers</h2>
            <MultiSelect
              value={comparisonManagers}
              options={managerOptions}
              onChange={(e) => setComparisonManagers(e.value)}
              placeholder="Select Managers"
              display="chip"
              className="w-full md:w-80"
            />
            <Plot
              data={managersToCompare.map(manager => {
                const userProjects = data.filter(d => d.username === manager);
                return {
                  type: 'bar',
                  name: manager,
                  x: userProjects.map(p => `${p.project_name}`),
                  y: userProjects.map(p => Number(p.duration ?? 0))
                };
              })}
              layout={{ barmode: 'stack', title: 'Project Manager Comparison' }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
