import React, { useEffect, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import axios from 'axios';
import apiBaseUrl from '../../apiConfig';
import '../Home.css';
import { Dropdown } from 'primereact/dropdown';


const Dashboard = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [kpis, setKpis] = useState({ current: 0, previous: 0 });
  const [projectDurations, setProjectDurations] = useState([]);
  const [userHours, setUserHours] = useState([]);
  const [submissionFreq, setSubmissionFreq] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [rangeMode, setRangeMode] = useState('range'); // default: date range
  const [visibilityFilter, setVisibilityFilter] = useState('Total');
  const [missingHours, setMissingHours] = useState([]);



  const fetchDashboardData = async () => {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    try {
      const [current, previous, projects, users, freq, missing_hours] = await Promise.all([
        axios.get(`${apiBaseUrl}/timesheets/total-logged-hours`, {
          params: { startdate: start, enddate: end, filter: visibilityFilter },
        }),
        axios.get(`${apiBaseUrl}/timesheets/previous-logged-hours`, {
          params: { startdate: start, enddate: end, filter: visibilityFilter },
        }),
        axios.get(`${apiBaseUrl}/timesheets/project-duration`, {
          params: { startdate: start, enddate: end, filter: visibilityFilter },
        }),
        axios.get(`${apiBaseUrl}/timesheets/user-project-hours`, {
          params: { startdate: start, enddate: end },
        }),
        axios.get(
          `${apiBaseUrl}/timesheets/user-submission-frequency`,
          {
            params: { startdate: start, enddate: end },
          }
        ),
        axios.get(`${apiBaseUrl}/timesheets/user-expected-vs-submitted-hours`, {
          params: { startdate: start, enddate: end },
        }),
      ]);

      setKpis({ current: current.data.hours, previous: previous.data.hours });
      setProjectDurations(projects.data);
      setUserHours(users.data);
      setSubmissionFreq(freq.data);
      setMissingHours(missing_hours.data);
    } catch (error) {
      console.error("Dashboard fetch error", error);
    }
  };

  useEffect(() => {
    if (startDate && endDate && visibilityFilter) {
      fetchDashboardData();
  
    }
  }, [startDate, endDate, visibilityFilter]);


  const formatPercentage = () => {
    if (kpis.previous === 0) return 'N/A';
    const delta = ((kpis.current - kpis.previous) / kpis.previous) * 100;
    return `${delta.toFixed(1)}%`;
  };

  return (
    <div className="main-container">
      <div className="card">
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
          placeholder="Select Visibility"
          className="w-full md:w-56"
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
              onClick={fetchDashboardData}
              className="p-button-raised p-button-info text-white shadow-md"
            />
          </>
        )}

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
              onClick={fetchDashboardData}
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
              onClick={fetchDashboardData}
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
              onClick={fetchDashboardData}
              className="p-button-raised p-button-info text-white shadow-md"
            />
          </>
        )}
      </div>

      {/*<div className="card enhanced-card">
        <h2 className="card-title">🎯 Φιλτράρισμα Εφαρμογής</h2>
        <div className="filter-section flex gap-4 items-end">
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
            onClick={fetchDashboardData}
            className="p-button-raised p-button-info text-white shadow-md"
          />
        </div>
      </div>
      */}

      <div className="dashboard-metrics">
        <div className="kpi-card">🕒 Current: {kpis.current}h</div>
        <div className="kpi-card">📉 Previous: {kpis.previous}h</div>
        <div className="kpi-card">📈 Δ%: {formatPercentage()}</div>
      </div>

      <div className="chart-section">
        <div className="card">
          <h3>📌 Project Durations</h3>
          <h4>
            Συνολικές ώρες αφιερωμένες σε κάθε project ξεχωριστά ανάλογα με το
            φίλτρο
          </h4>
          <Chart
            type="bar"
            data={{
              labels: projectDurations.map((p) => p.project_name),
              datasets: [
                {
                  label: "Hours",
                  data: projectDurations.map((p) => p.hours),
                  backgroundColor: "#42A5F5",
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
        <div className="card">
          <h3 className="mt-6">🏗️ Project Hours by User</h3>
          <Dropdown
            value={selectedProject}
            options={[...new Set(userHours.map((u) => u.project_name))].map(
              (name) => ({ label: name, value: name })
            )}
            onChange={(e) => setSelectedProject(e.value)}
            placeholder="Select a project"
            className="w-full md:w-64 mb-4"
          />
          {selectedProject && (
            <div>
              <h4>
                Συνολικές ώρες για {selectedProject} για κάθε χρήστη που έχει
                ασχοληθεί με βάση το φίλτρο
              </h4>
              <Chart
                type="bar"
                data={{
                  labels: userHours
                    .filter((u) => u.project_name === selectedProject)
                    .map((u) => u.username),
                  datasets: [
                    {
                      label: `Hours for ${selectedProject}`,
                      data: userHours
                        .filter((u) => u.project_name === selectedProject)
                        .map((u) => u.hours),
                      backgroundColor: "#FFA726",
                    },
                  ],
                }}
                options={{
                  indexAxis: "y",
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { title: { display: true, text: "Hours" } },
                    y: { title: { display: true, text: "User" } },
                  },
                }}
                style={{ maxWidth: "900px", height: "400px", margin: "0 auto" }}
              />
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mt-6">👤 User Hours by Project</h3>
          <Dropdown
            value={selectedUser}
            options={[...new Set(userHours.map((u) => u.username))].map(
              (name) => ({ label: name, value: name })
            )}
            onChange={(e) => setSelectedUser(e.value)}
            placeholder="Select a user"
            className="w-full md:w-64 mb-4"
          />
          {selectedUser && (
            <div>
              <h4>
                Συνολικές ώρες για κάθε project που έχει ασχοληθεί ο{" "}
                {selectedUser} με βάση το φίλτρο
              </h4>
              <Chart
                type="bar"
                data={{
                  labels: userHours
                    .filter((u) => u.username === selectedUser)
                    .map((u) => u.project_name),
                  datasets: [
                    {
                      label: `${selectedUser}'s Hours`,
                      data: userHours
                        .filter((u) => u.username === selectedUser)
                        .map((u) => u.hours),
                      backgroundColor: "#66BB6A",
                    },
                  ],
                }}
                options={{
                  indexAxis: "y",
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { title: { display: true, text: "Hours" } },
                    y: { title: { display: true, text: "Project" } },
                  },
                }}
                style={{ maxWidth: "900px", height: "400px", margin: "0 auto" }}
              />
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mt-6">📅 Submission Frequency</h3>
          <h4>
            Μέσος όρος συμπλήρωσης kimai απο τους χρήστες με βάση το φίλτρο
          </h4>
          <Chart
            type="bar"
            data={{
              labels: submissionFreq.map((u) => u.username),
              datasets: [
                {
                  label: "Avg Days Between Submissions",
                  data: submissionFreq.map((u) => u.avg_gap || 0),
                  backgroundColor: "#FF7043",
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                y: { title: { display: true, text: "Days" } },
              },
            }}
          />
        </div>

        {/* <div className="card">
          <h3 className="mt-6">⏱️ Missing Hours by User</h3>
          <h4>
            Ώρες που δεν έχουν καταγραφεί στο Kimai σε σχέση με τις αναμενόμενες
          </h4>
          <Chart
            type="bar"
            data={{
              labels: missingHours.map((u) => u.username),
              datasets: [
                {
                  label: "Missing Hours",
                  data: missingHours.map((u) => u.missing_hours),
                  backgroundColor: "#EF5350",
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: "Missing Hours" },
                },
                x: {
                  title: { display: true, text: "User" },
                },
              },
            }}
            style={{ maxWidth: "900px", margin: "0 auto" }}
          />
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
