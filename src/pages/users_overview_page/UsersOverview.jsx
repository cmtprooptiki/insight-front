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
import './UsersOverview.css';
import InfoBox from '../../components/InfoBox';
import apiBaseUrl from '../../apiConfig';


const UsersOverview = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [submitted, setSubmitted] = useState(false);
  const [filterOption, setFilterOption] = useState('Total');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProjectData, setUserProjectData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [monthlyChartData, setMonthlyChartData] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [rangeMode, setRangeMode] = useState('range'); // default: date range
  const [visibilityFilter, setVisibilityFilter] = useState('Total');
  

  useEffect(() => {
    if (startDate && endDate && visibilityFilter) {
      fetchData();
    }
  }, [startDate, endDate, visibilityFilter]);

  useEffect(() => {
  if (!selectedUser || !selectedProject) return;

  axios.get(`${apiBaseUrl}/users-overview-project-timelogs`, {
    params: { alias: selectedUser, project: selectedProject }
  }).then(res => {
    const raw = res.data.map(r => ({
      ...r,
      start_time: new Date(r.start_time),
      duration: Math.floor(r.duration / 3600)
    }));

    // Extract years across all rows
    const allYears = [...new Set(raw.map(r => r.start_time.getFullYear()))];
    setAvailableYears(allYears);

    raw.forEach(r => {
      r.year = r.start_time.getFullYear();
      r.month = r.start_time.getMonth() + 1;
    });

    // Set chart data only if selectedYear is already chosen
    if (selectedYear) {
      const yearFiltered = raw.filter(r => r.year === selectedYear);
      const monthly = Array(12).fill(0);
      yearFiltered.forEach(r => {
        monthly[r.month - 1] += r.duration;
      });

      setMonthlyChartData({
        labels: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ],
        datasets: [{
          label: `Duration (h) for ${selectedProject}`,
          data: monthly,
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.3,
          pointBackgroundColor: 'green',
          pointRadius: monthly.map(val => val > 0 ? 6 : 0)
        }]
      });
    }
  });
}, [selectedUser, selectedProject, selectedYear]);

  const fetchData = async () => {
    if (!(startDate instanceof Date) || isNaN(startDate) ||
        !(endDate instanceof Date) || isNaN(endDate) || !filterOption) {
      console.warn("Invalid or missing input");
      return;
    }

    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    try {
      const res = await axios.get(`${apiBaseUrl}/users-overview`, {
        params: { startdate: start, enddate: end, filter: filterOption }
      });

      const filtered = res.data.filter(d => d.alias !== 'ADMINISTRATOR' && d.name !== 'Out of Office');
      const transformed = filtered.map(d => ({
        ...d,
        duration: Math.floor(d.duration / 3600),
        cost: parseFloat(d.rate) * Math.floor(d.duration / 3600)
      }));
      setData(transformed);
      setFilteredData(transformed);
      setUserOptions([...new Set(transformed.map(d => d.alias))].map(name => ({ label: name, value: name })));
      setSubmitted(true)
      
      setSelectedUser(null);
      setUserProjectData([]);
      setSelectedProject(null);
      setSelectedYear(null);
      setMonthlyChartData(null);
      setAvailableYears([]);
    } catch (err) {
      console.error('Failed to load user overview data', err);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    const userData = data.filter(d => d.alias === user);
    setUserProjectData(userData);
    setSelectedProject(null);
    setSelectedYear(null);
    setMonthlyChartData(null);
    const years = [...new Set(userData.map(d => new Date(d.start_time).getFullYear()))];
    setAvailableYears(years);
  };

  const pieData = () => {
    const userProjectMap = {};
    filteredData.forEach(row => {
      if (!userProjectMap[row.alias]) userProjectMap[row.alias] = new Set();
      userProjectMap[row.alias].add(row.name);
    });

    const labels = Object.keys(userProjectMap);
    const dataCounts = labels.map(label => userProjectMap[label].size);
    const projectLists = labels.map(label => Array.from(userProjectMap[label]));

    return {
      labels,
      datasets: [{
        data: dataCounts,
        backgroundColor: ["#42A5F5", "#66BB6A", "#FFA726", "#26C6DA", "#7E57C2"],
        projectLists
      }]
    };
  };

  const summaryByUser = () => {
    const groups = {};
    filteredData.forEach(row => {
      if (!groups[row.alias]) groups[row.alias] = 0;
      groups[row.alias] += row.duration;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  };

  const summaryBarData = () => {
    const sorted = summaryByUser();
    return {
      labels: sorted.map(d => d[0]),
      datasets: [{
        label: 'Total Hours',
        data: sorted.map(d => d[1]),
        backgroundColor: '#48bb78'
      }]
    };
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* <div className="card">
        <h2>User Overview Filters</h2>
        <div className="flex flex-wrap gap-4 items-end">
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
            value={filterOption}
            onChange={(e) => setFilterOption(e.value)}
            options={["Active", "Inactive", "Total"]}
            placeholder="Select Filter"
            className="w-full md:w-40"
          />
          <Button
            label="Apply Filters"
            // onClick={() => setSubmitted(true)}
            onClick={()=>{
              setSubmitted(true);
              fetchData();
            }}
            className="p-button-success"
          />
        </div>
      </div> */}
      {/* {console.log("submitted",submitted)} */}
      <div style={{display: "flex",flexDirection: "column",width: "800px",gap: "6px"}}>

      <Dropdown
              value={rangeMode}
              options={[
                { label: "Date Range", value: "range" },
                { label: "Month", value: "month" },
                { label: "Quarter", value: "quarter" },
                { label: "Half-Year", value: "half" },
              ]}
              onChange={(e) => setRangeMode(e.value)}
              placeholder="Select Range Type"
              className="md:w-56"
            />
            <Dropdown
              value={visibilityFilter}
              options={[
                { label: "Total", value: "Total" },
                { label: "Active Only", value: "Active" },
                { label: "Inactive Only", value: "Inactive" },
              ]}
              onChange={(e) => setVisibilityFilter(e.value)}
              placeholder="Select Visibility"
              className="md:w-56"
            />
            {rangeMode === "range" && (
              <>
                <Calendar
                  value={startDate}
                  onChange={(e) => setStartDate(e.value)}
                  showIcon
                />
                <Calendar
                  value={endDate}
                  onChange={(e) => setEndDate(e.value)}
                  showIcon
                />
                <Button
                  label="Φόρτωσε Δεδομένα"
                  onClick={fetchData}
                  className="p-button-raised p-button-info text-white shadow-md"
                />
              </>
            )}
            </div>
            

            <InfoBox startDate={startDate} endDate={endDate}/>

      
            {rangeMode === "month" && (
              <>
                <Calendar
                  view="month"
                  dateFormat="mm/yy"
                  value={startDate}
                  onChange={(e) => {
                    const first = new Date(
                      e.value.getFullYear(),
                      e.value.getMonth(),
                      1
                    );
                    const last = new Date(
                      e.value.getFullYear(),
                      e.value.getMonth() + 1,
                      0
                    );
                    setStartDate(first);
                    setEndDate(last);
                  }}
                  showIcon
                />
                <Button
                  label="Φόρτωσε Δεδομένα"
                  onClick={fetchData}
                  className="p-button-raised p-button-info text-white shadow-md"
                />
              </>
            )}
      
            {rangeMode === "quarter" && (
              <>
                <Dropdown
                  value={startDate}
                  options={[
                    {
                      label: "Q1 (Jan-Mar)",
                      value: new Date(new Date().getFullYear(), 0, 1),
                    },
                    {
                      label: "Q2 (Apr-Jun)",
                      value: new Date(new Date().getFullYear(), 3, 1),
                    },
                    {
                      label: "Q3 (Jul-Sep)",
                      value: new Date(new Date().getFullYear(), 6, 1),
                    },
                    {
                      label: "Q4 (Oct-Dec)",
                      value: new Date(new Date().getFullYear(), 9, 1),
                    },
                  ]}
                  onChange={(e) => {
                    const s = new Date(e.value);
                    const eDate = new Date(s.getFullYear(), s.getMonth() + 3, 0);
                    setStartDate(s);
                    setEndDate(eDate);
                  }}
                  placeholder="Select Quarter"
                  className="w-full md:w-64"
                />
                <Button
                  label="Φόρτωσε Δεδομένα"
                  onClick={fetchData}
                  className="p-button-raised p-button-info text-white shadow-md"
                />
              </>
            )}
      
            {rangeMode === "half" && (
              <>
                <Dropdown
                  value={startDate}
                  options={[
                    {
                      label: "First Half (Jan-Jun)",
                      value: new Date(new Date().getFullYear(), 0, 1),
                    },
                    {
                      label: "Second Half (Jul-Dec)",
                      value: new Date(new Date().getFullYear(), 6, 1),
                    },
                  ]}
                  onChange={(e) => {
                    const s = new Date(e.value);
                    const eDate = new Date(s.getFullYear(), s.getMonth() + 6, 0);
                    setStartDate(s);
                    setEndDate(eDate);
                  }}
                  placeholder="Select Half-Year"
                  className="w-full md:w-64"
                />
                <Button
                  label="Φόρτωσε Δεδομένα"
                  onClick={fetchData}
                  className="p-button-raised p-button-info text-white shadow-md"
                />
              </>
            )}

      {submitted && (
        <>
          <div className="card">
            <h3>Συνολικά Projects που ασχολείται κάθε χρήστης</h3>
            <Chart
              type="pie"
              data={pieData()}
              options={{
                plugins: {
                  legend: { position: "bottom" },
                  tooltip: {
                    callbacks: {
                      label: (tooltipItem) => {
                        const index = tooltipItem.dataIndex;
                        const label = tooltipItem.chart.data.labels[index];
                        const projects =
                          tooltipItem.chart.data.datasets[0].projectLists[
                            index
                          ];
                        const projectLines = projects || [];
                        return [
                          `${label}:`,
                          ...projectLines,
                          `Total Projects: ${projectLines.length}`,
                        ];
                      },
                    },
                  },
                },
              }}
              style={{ maxWidth: "700px", height: "500px" }}
            />
          </div>

          <div className="card">
            <h3>Συνολικές ώρες κάθε Χρήστη</h3>
            <Chart
              type="bar"
              data={summaryBarData()}
              options={{
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: {
                  x: { title: { display: true, text: "Hours" } },
                  y: { title: { display: true, text: "User" } },
                },
              }}
            />
          </div>

          <div className="card">
            <h3>Επιλέξτε Χρήστη</h3>
            <Dropdown
              value={selectedUser}
              onChange={(e) => handleUserSelect(e.value)}
              options={userOptions}
              placeholder="Select User"
              className="w-full md:w-64"
              filter
            />

            {selectedUser && userProjectData.length > 0 && (
              <>
                <h4 className="mt-4 font-semibold">
                  Total Duration:{" "}
                  {userProjectData.reduce((sum, d) => sum + d.duration, 0)}{" "}
                  Hours
                </h4>
                <DataTable
                  value={userProjectData}
                  paginator
                  rows={5}
                  stripedRows
                  responsiveLayout="scroll"
                >
                  <Column field="name" header="Project" />
                  <Column field="duration" header="Duration (h)" />
                  <Column field="rate" header="Hourly Rate" />
                  <Column field="cost" header="Total Cost (€)" />
                </DataTable>
                <h3>Αναλυτικά συνολικές ώρες του χρήστη {selectedUser}</h3>
                <Chart
                  type="pie"
                  data={{
                    labels: userProjectData.map((d) => d.name),
                    datasets: [
                      {
                        data: userProjectData.map((d) => d.duration),
                        backgroundColor: [
                          "#42A5F5",
                          "#66BB6A",
                          "#FFA726",
                          "#EC407A",
                          "#AB47BC",
                        ],
                      },
                    ],
                  }}
                  options={{ plugins: { legend: { position: "bottom" } } }}
                  style={{ maxWidth: "600px", height: "500px" }}
                />
                <h3>Συνολικό κόστος ανα Project για τον {selectedUser}</h3>
                <Chart
                  type="bar"
                  data={{
                    labels: userProjectData.map((d) => d.name),
                    datasets: [
                      {
                        label: "Cost (€)",
                        data: userProjectData.map((d) => d.cost),
                        backgroundColor: "#805ad5",
                      },
                    ],
                  }}
                  options={{
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { title: { display: true, text: "Project" } },
                      y: { title: { display: true, text: "Cost (€)" } },
                    },
                  }}
                  style={{ maxWidth: "800px", height: "600px" }}
                />
              </>
            )}

            <h3 className="mt-4">Επιλέξτε Project από τη λίστα</h3>
            <Dropdown
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.value);
                setSelectedYear(null);
                setMonthlyChartData(null);
              }}
              options={userProjectData.map((d) => ({
                label: d.name,
                value: d.name,
              }))}
              placeholder="Επίλεξε Project"
              className="w-full md:w-64"
            />

            {selectedProject && (
              <>
                <h4 className="mt-4">Επιλέξτε Έτος</h4>
                <Dropdown
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.value)}
                  options={availableYears.map((y) => ({ label: y, value: y }))}
                  placeholder="Επιλέξτε Έτος"
                  className="w-full md:w-64"
                />
                {console.log(
                  "User project data start_times:",
                  userProjectData.map((d) => d.startime)
                )}

                

                {monthlyChartData && (
                  <>
                  <h4 className="mt-4">Αναλυτικά οι συνολικές ώρες που έχει δαπανήσει ο {selectedUser} στο Project {selectedProject} για το έτος {selectedYear} </h4>
                  <Chart
                    type="line"
                    data={monthlyChartData}
                    options={{
                      plugins: { legend: { display: true } },
                      scales: {
                        x: { title: { display: true, text: "Months" } },
                        y: {
                          title: { display: true, text: "Total Duration (h)" },
                        },
                      },
                    }}
                    style={{
                      maxWidth: "900px",
                      height: "450px",
                      margin: "2rem auto",
                    }}
                  />
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UsersOverview;
