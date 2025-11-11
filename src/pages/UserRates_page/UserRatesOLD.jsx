import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import './UserRates.css';
import apiBaseUrl from '../../apiConfig';

const UserRates = () => {
  const [data, setData] = useState([]);
  const [editingRows, setEditingRows] = useState({});
  const toast = React.useRef(null);

  const fetchUserRates = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/dayoff-hourly-rates`);
      setData(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUserRates();
  }, []);

  const onRowEditComplete = async (e) => {
    const { newData, index } = e;
    const { user_id, hourly_rate } = newData;

    const updated = [...data];
    updated[index] = newData;
    setData(updated);
    

    try {
      await axios.patch(`${apiBaseUrl}/update-hourly-rate`, {
        userId: user_id,
        hourly_rate: parseFloat(hourly_rate),
      });
      toast.current.show({ severity: 'success', summary: 'Updated', detail: 'Hourly rate saved', life: 2000 });
    } catch (err) {
      console.error("Update error:", err);
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to save', life: 3000 });
    }
  };

  const hourlyRateEditor = (options) => {
    return (
      <InputText
        type="number"
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
      />
    );
  };

  return (
    <div className="p-6">
      <Toast ref={toast} />
      <h2>💼 Editable User Hourly Rates</h2>
      <DataTable
        value={data}
        editMode="row"
        dataKey="users_id"
        onRowEditComplete={onRowEditComplete}
        paginator
        rows={10}
        className="p-datatable-gridlines"
      >
        <Column field="username" header="Username" style={{ width: '50%' }} />
        <Column
          field="hourly_rate"
          header="Hourly Rate (€)"
          editor={(options) => hourlyRateEditor(options)}
          style={{ width: '30%' }}
        />
        <Column rowEditor header="Edit" style={{ width: '10%', textAlign: 'center' }} />
      </DataTable>
    </div>
  );
};

export default UserRates;
