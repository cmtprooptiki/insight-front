import React, { useEffect, useState } from 'react';
import axios from 'axios';
import apiBaseUrl from '../../apiConfig';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import Chart from 'react-apexcharts';
import './ProjectOverview.css';
import InfoBox from '../../components/InfoBox';

const ProjectOverview = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('Active');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [rangeMode, setRangeMode] = useState('range');
  const [visibilityFilter, setVisibilityFilter] = useState('Total');
  const [projectDurations, setProjectDurations] = useState([]);
  const [userHours, setUserHours] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectUserData, setProjectUserData] = useState([]);
  const [activeUserCount, setActiveUserCount] = useState(0);
  const [activeProjectCount, setActiveProjectCount] = useState(0);
  const [totalUsersInProject, setTotalUsersInProject] = useState(0);
  const [projectUserCostData, setProjectUserCostData] = useState([]);
  const [totalProjectCost, setTotalProjectCost] = useState(0);
  const [projectBudget, setProjectBudget] = useState();

const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

const [yearOptions, setYearOptions] = useState([]);

const [monthlyCostData, setMonthlyCostData] = useState([]);
const [monthlyHoursData, setMonthlyHoursData] = useState([]);


useEffect(() => {
  if (startDate && endDate && visibilityFilter) {
    getProjectOverview();
  }
}, [startDate, endDate, visibilityFilter,selectedProject]);

const getYearsBetween = (start, end) => {
  const years = [];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  for (let y = startYear; y <= endYear; y++) {
    years.push({ label: y.toString(), value: y });
  }
  return years;
};

  const getProjectOverview = async () => {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

      // Generate available years for dropdown
  setYearOptions(getYearsBetween(startDate, endDate));
  if (!yearOptions.find((opt) => opt.value === selectedYear)) {
    setSelectedYear(startDate.getFullYear());
  }


    try {
      const [projects, users, overviewData, activeUsers, activeProjects] = await Promise.all([
        axios.get(`${apiBaseUrl}/timesheets/project-duration`, {
          params: { startdate: start, enddate: end, filter: visibilityFilter },
        }),
        axios.get(`${apiBaseUrl}/timesheets/user-project-hours`, {
          params: { startdate: start, enddate: end },
        }),
        axios.get(`${apiBaseUrl}/projects-overview`, {
          params: { startdate: start, enddate: end, filter: visibilityFilter },
        }),
        axios.get(`${apiBaseUrl}/active-count`, {
          params: { startdate: start, enddate: end },
        }),
        axios.get(`${apiBaseUrl}/active-count-project`, {
          params: { startdate: start, enddate: end },
        }),
        
      ]);

      setData(overviewData.data);
      setProjectDurations(projects.data);
      setUserHours(users.data);
      setActiveUserCount(activeUsers.data.total || 0);
      setActiveProjectCount(activeProjects.data.total || 0);
    } catch (error) {
      console.error("Dashboard fetch error", error);
    }
  };

  const fetchProjectUsers = async (projectName, yearParam = selectedYear) => {
  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];

  const year = yearParam;
        {console.log("The selecte year is:",year)}

    console.log("inside fetch:",projectName)
  try {
    const [
      userData,
      totalCount,
      costData,
      budgetRes,
      monthlyCostRes,
      monthlyHoursRes,
    ] = await Promise.all([
      axios.get(`${apiBaseUrl}/timesheets/project-users-hours`, {
        params: {
          projectName,
          startdate: start,
          enddate: end,
          filter: visibilityFilter,
        },
      }),
      axios.get(`${apiBaseUrl}/projects/total-users`, {
        params: { projectName, startdate: start, enddate: end },
      }),
      axios.get(`${apiBaseUrl}/project-users-hourly-costs`, {
        params: { projectName, startdate: start, enddate: end },
      }),
      // axios.get(`${apiBaseUrl}/timesheets/project-total-cost", {
      //   params: { projectName, startdate: start, enddate: end },
      // }),

      axios.get(`${apiBaseUrl}/projects/budget`, {
        params: { projectName },
      }),

      axios.get(`${apiBaseUrl}/project-users-monthly-costs`, {
        params: { projectName, year },
      }),

      axios.get(`${apiBaseUrl}/project-users-monthly-hours`, {
        params: { projectName, year },
      }),
    ]);
    const totalCost = costData.data.reduce((sum, user) => {
      const cost = (user.total_cost || 0);
      return sum + cost;
    }, 0);

    setTotalProjectCost(totalCost);

    setProjectUserData(userData.data);
    setTotalUsersInProject(totalCount.data.total_users || 0);
    setProjectUserCostData(costData.data);
    setProjectBudget(budgetRes.data.budget || 0);
    setMonthlyCostData(monthlyCostRes.data);
    setMonthlyHoursData(monthlyHoursRes.data);

  } catch (error) {
    console.error("Failed to fetch users or total count for project:", error);
        setMonthlyCostData([]);

    setProjectUserData([]);
    setTotalUsersInProject(0);
  }
};


  const sortedDurations = [...projectDurations].sort((a, b) => b.hours - a.hours);
  const pieChartData = {
    series: sortedDurations.map((p) => p.hours),
    options: {
      chart: {
        type: 'pie',
      },
      labels: sortedDurations.map((p) => p.project_name),
      legend: {
        position: 'right',
      },
      dataLabels: {
        enabled: true,
        formatter: (val, opts) => {
          const name = opts.w.globals.labels[opts.seriesIndex];
          return `${val.toFixed(2)}%`;
        },
      },
    },
  };

  const projectBarChart = {
    series: [{
      name: "Hours",
      data: projectDurations.map((p) => p.hours),
    }],
    options: {
      chart: { type: 'bar' },
      xaxis: { categories: projectDurations.map((p) => p.project_name) },
      plotOptions: {
        bar: { distributed: true }
      },
      legend: { show: false }
    }
  };

  return (
    <div className="p-6 space-y-6">
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
        className=" md:w-56"
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
            onClick={getProjectOverview}
            className="p-button-info"
          />
        </>
      )}
      </div>
      <InfoBox startDate={startDate} endDate={endDate}/>


      <div className="dashboard-metrics">
        <div className="kpi-card">👥 Total Active Users: {activeUserCount}</div>
        <div className="kpi-card">
          📁 Total Active Projects: {activeProjectCount}
          <p className="kpi-note">
            * Ανάμεσα στα έργα συμπεριλαμβάνονται και τα Business Development
            για κάθε πελάτη
          </p>
        </div>
      </div>

      {data.length > 0 && (
        <div className="card">
          <h3>Αποτελέσματα Project Overview</h3>
          <DataTable
            value={data}
            paginator
            rows={10}
            className="p-datatable-gridlines"
          >
            <Column field="project_name" header="Project" />
            <Column field="alias" header="User" />
            <Column
              field="enabled"
              header="Enabled"
              body={(row) => (row.enabled ? "Yes" : "No")}
            />
            <Column
              field="duration"
              header="Duration (h)"
              body={(row) => (row.duration / 3600).toFixed(2)}
            />
            <Column field="starttime" header="Start Time" />
            <Column field="lasttime" header="Last Time" />
          </DataTable>
        </div>
      )}

      <div className="card">
        <TabView>
          <TabPanel header="Συνολική διάρκεια ανά Project">
            <Chart
              options={projectBarChart.options}
              series={projectBarChart.series}
              type="bar"
              height={400}
            />
          </TabPanel>
          <TabPanel header="Ποσοστά Χρόνου ανά Project">
            <Chart
              options={pieChartData.options}
              series={pieChartData.series}
              type="pie"
              height={400}
            />
          </TabPanel>
        </TabView>
      </div>

      <h3 className="mt-6">👥 Users by Project</h3>
      <Dropdown
        value={selectedProject}
        options={projectDurations.map((p) => ({
          label: p.project_name,
          value: p.project_name,
        }))}
        onChange={(e) => {
          setSelectedProject(e.value);
          fetchProjectUsers(e.value);
        }}
        className="w-full md:w-64 mb-4"
        placeholder="Select a project"
      />

      {selectedProject && (
        <div className="kpi-card mt-4">
          👤 Συνολικοί Χρήστες για το έργο <strong>{selectedProject}</strong>:{" "}
          <strong>{totalUsersInProject}</strong>
        </div>
      )}

      {selectedProject && projectUserData.length > 0 && (
        <Chart
          options={{
            chart: { type: "bar" },
            xaxis: { categories: projectUserData.map((u) => u.username) },
            plotOptions: { bar: { horizontal: true } },
            legend: { show: false },
          }}
          series={[
            {
              name: `Hours on ${selectedProject}`,
              data: projectUserData.map((u) => u.hours),
            },
          ]}
          type="bar"
          height={400}
        />
      )}

      {selectedProject && (
        <div className="kpi-card mt-2">
          💰 Συνολικό Κόστος για το έργο <strong>{selectedProject}</strong>:{" "}
          <strong>
            {new Intl.NumberFormat("el-GR", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(totalProjectCost)}
          </strong>
        </div>
      )}

      {selectedProject && projectBudget > 0 && (
        <div className="kpi-card mt-2">
          📊 Συνολικός Προϋπολογισμός(Budget) για το έργο{" "}
          <strong>{selectedProject}</strong>:{" "}
          <strong>
            {new Intl.NumberFormat("el-GR", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(projectBudget)}{" "}
          </strong>
        </div>
      )}

      {selectedProject && projectBudget > 0 && (
        <div className="kpi-card mt-2">
          📊 Ποσοστό Κόστους Προσωπικού για το έργο{" "}
          <strong>{selectedProject}</strong>:{" "}
          <strong>
            {((totalProjectCost / projectBudget) * 100).toFixed(2)}%
          </strong>
        </div>
      )}

      {selectedProject && projectBudget > 0 && (
        <div className="card">
          <h3>📊 Ποσοστό Κόστους Προσωπικού για το έργο</h3>
          <h3>
            <strong>{selectedProject}</strong>
          </h3>
          <Chart
            options={{
              labels: ["Κόστος Προσωπικού", "Υπόλοιπο Προϋπολογισμού"],
              legend: { position: "bottom" },
              dataLabels: {
                enabled: true,
                formatter: (val) => `${val.toFixed(2)}%`,
              },
              tooltip: {
                y: {
                  formatter: (val) =>
                    new Intl.NumberFormat("el-GR", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(val),
                },
              },
            }}
            series={[
              totalProjectCost,
              Math.max(projectBudget - totalProjectCost, 0),
            ]}
            type="pie"
            height={400}
          />
        </div>
      )}
      {console.log("projectUserCostData:",projectUserCostData)}
      {selectedProject && projectUserCostData.length > 0 && (
        <Chart
          options={{
            chart: { type: "bar" },
            xaxis: {
              categories: projectUserCostData.map((u) => u.username),
              title: { text: "User" },
            },
            plotOptions: {
              bar: { horizontal: true },
            },
            legend: { show: false },
            tooltip: {
              y: {
                formatter: (val) =>
                  new Intl.NumberFormat("el-GR", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(val),
              },
            },
            dataLabels: {
              enabled: true,
              formatter: (val) =>
                new Intl.NumberFormat("el-GR", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(val),
            },
          }}
          series={[
            {
              name: `Κόστος σε ${selectedProject}`,
              data: projectUserCostData.map((u) =>
                // parseFloat((u.hours * (u.hourly_rate || 0)).toFixed(2))

                parseFloat( (u.total_cost || 0).toFixed(2))
              ),
            },
          ]}
          type="bar"
          height={400}
        />
      )}

      {console.log(getYearsBetween(startDate, endDate))}


      {/* {selectedProject && monthlyCostData.length > 0 && (
        <div className="card">
          <h3>
            📆 Μηνιαίο Κόστος Ανά Χρήστη για το Έργο{" "}
            <strong>{selectedProject}</strong> ({selectedYear})
          </h3>
          <Chart
            type="line"
            height={450}
            options={{
              chart: { id: "monthly-user-cost", zoom: { enabled: true } },
              xaxis: {
                categories: [
                  "Ιαν",
                  "Φεβ",
                  "Μαρ",
                  "Απρ",
                  "Μαϊ",
                  "Ιουν",
                  "Ιουλ",
                  "Αυγ",
                  "Σεπ",
                  "Οκτ",
                  "Νοε",
                  "Δεκ",
                ],
                title: { text: "Μήνας" },
              },
              yaxis: {
                title: { text: "Κόστος (€)" },
                labels: {
                  formatter: (val) =>
                    new Intl.NumberFormat("el-GR", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 2,
                    }).format(val),
                },
              },
              tooltip: {
                y: {
                  formatter: (val) =>
                    new Intl.NumberFormat("el-GR", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 2,
                    }).format(val),
                },
              },
              dataLabels: { enabled: false },
              legend: { position: "bottom" },
            }}
            series={monthlyCostData.map((user) => ({
              name: user.alias,
              data: user.monthly_costs.map((val) => parseFloat(val)),
            }))}
          />
        </div>
      )} */}

      {/* {selectedProject && monthlyHoursData.length > 0 && (
        <div className="card">
          <h3>
            🕒 Μηνιαίες Ώρες Ανά Χρήστη για το Έργο{" "}
            <strong>{selectedProject}</strong> ({selectedYear})
          </h3>
          <Chart
            type="line"
            height={450}
            options={{
              chart: { id: "monthly-user-hours", zoom: { enabled: true } },
              xaxis: {
                categories: [
                  "Ιαν",
                  "Φεβ",
                  "Μαρ",
                  "Απρ",
                  "Μαϊ",
                  "Ιουν",
                  "Ιουλ",
                  "Αυγ",
                  "Σεπ",
                  "Οκτ",
                  "Νοε",
                  "Δεκ",
                ],
                title: { text: "Μήνας" },
              },
              yaxis: {
                title: { text: "Ώρες" },
                labels: {
                  formatter: (val) => val.toFixed(2),
                },
              },
              tooltip: {
                y: {
                  formatter: (val) => `${val.toFixed(2)} ώρες`,
                },
              },
              dataLabels: { enabled: false },
              legend: { position: "bottom" },
            }}
            series={monthlyHoursData.map((user) => ({
              name: user.alias,
              data: user.monthly_hours.map((val) => parseFloat(val)),
            }))}
          />
        </div>
      )} */}

      <div className="card">
              {selectedProject && (
        <Dropdown
          value={selectedYear}
          options={getYearsBetween(startDate, endDate)}
          onChange={(e) => {
            const year = e.value;
            setSelectedYear(year);
            if (selectedProject) {
              fetchProjectUsers(selectedProject, year); // Pass year directly
            }
          }}
          placeholder="Επιλέξτε Έτος"
          className="w-full md:w-64 mb-4"
        />
      )}
        <TabView>
          <TabPanel header="Κόστος έργου Ανα μήνα Ανα Χρήστη">
            {selectedProject && monthlyCostData.length > 0 && (
              <div className="card">
                <h3>
                  📆 Μηνιαίο Κόστος Ανά Χρήστη για το Έργο{" "}
                  <strong>{selectedProject}</strong> ({selectedYear})
                </h3>
                <Chart
                  type="line"
                  height={450}
                  options={{
                    chart: { id: "monthly-user-cost", zoom: { enabled: true } },
                    xaxis: {
                      categories: [
                        "Ιαν",
                        "Φεβ",
                        "Μαρ",
                        "Απρ",
                        "Μαϊ",
                        "Ιουν",
                        "Ιουλ",
                        "Αυγ",
                        "Σεπ",
                        "Οκτ",
                        "Νοε",
                        "Δεκ",
                      ],
                      title: { text: "Μήνας" },
                    },
                    yaxis: {
                      title: { text: "Κόστος (€)" },
                      labels: {
                        formatter: (val) =>
                          new Intl.NumberFormat("el-GR", {
                            style: "currency",
                            currency: "EUR",
                            minimumFractionDigits: 2,
                          }).format(val),
                      },
                    },
                    tooltip: {
                      y: {
                        formatter: (val) =>
                          new Intl.NumberFormat("el-GR", {
                            style: "currency",
                            currency: "EUR",
                            minimumFractionDigits: 2,
                          }).format(val),
                      },
                    },
                    dataLabels: { enabled: false },
                    legend: { position: "bottom" },
                  }}
                  series={monthlyCostData.map((user) => ({
                    name: user.alias,
                    data: user.monthly_costs.map((val) => parseFloat(val)),
                  }))}
                />
              </div>
            )}
          </TabPanel>
          <TabPanel header="Ωρες εργου Ανα μήνα Ανα χρήστη">
            {selectedProject && monthlyHoursData.length > 0 && (
              <div className="card">
                <h3>
                  🕒 Μηνιαίες Ώρες Ανά Χρήστη για το Έργο{" "}
                  <strong>{selectedProject}</strong> ({selectedYear})
                </h3>
                <Chart
                  type="line"
                  height={450}
                  options={{
                    chart: {
                      id: "monthly-user-hours",
                      zoom: { enabled: true },
                    },
                    xaxis: {
                      categories: [
                        "Ιαν",
                        "Φεβ",
                        "Μαρ",
                        "Απρ",
                        "Μαϊ",
                        "Ιουν",
                        "Ιουλ",
                        "Αυγ",
                        "Σεπ",
                        "Οκτ",
                        "Νοε",
                        "Δεκ",
                      ],
                      title: { text: "Μήνας" },
                    },
                    yaxis: {
                      title: { text: "Ώρες" },
                      labels: {
                        formatter: (val) => val.toFixed(2),
                      },
                    },
                    tooltip: {
                      y: {
                        formatter: (val) => `${(val || 0).toFixed(2)} ώρες`,
                      },
                    },
                    dataLabels: { enabled: false },
                    legend: { position: "bottom" },
                  }}
                  series={monthlyHoursData.map((user) => ({
                    name: user.alias,
                    data: user.monthly_hours.map((val) => parseFloat(val)),
                  }))}
                />
              </div>
            )}
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
};

export default ProjectOverview;
