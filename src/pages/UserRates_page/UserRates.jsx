import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DataScroller } from "primereact/datascroller";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import apiBaseUrl from "../../apiConfig";
import "./UserRates.css";

const defaultAvatarUrl = "/avatar-default.png"; // must be in /public

const UserRates = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // { user_id, username, avatar? }
  const [rateHistory, setRateHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingNew, setSavingNew] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    effective_from: "", // YYYY-MM-DD
    hourly_rate: "",
  });

  const toast = useRef(null);

  const fetchUserRates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiBaseUrl}/dayoff-hourly-rates`);
      setData(res.data ?? []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.current?.show({
        severity: "error",
        summary: "Load failed",
        detail: "Could not load user rates.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRates();
  }, []);

  const formatRate = (val) =>
    typeof val === "number" ? `${val.toFixed(2)} €` : "—";

  // ---------- Rate history modal ----------
  const openRateHistory = async (row) => {
    setSelectedUser(row);
    setRateModalOpen(true);
    setLoadingHistory(true);
    setRateHistory([]);
    try {
      const res = await axios.get(`${apiBaseUrl}/rates/${row.user_id || row.id}`, {
        // params: { userId: row.user_id || row.id },
      });
      const hist = (res.data || []).sort(
        (a, b) => new Date(b.effective_from) - new Date(a.effective_from)
      );
      setRateHistory(hist);
    } catch (err) {
      console.error("History fetch error:", err);
      toast.current?.show({
        severity: "error",
        summary: "Load failed",
        detail: "Could not load rate history for this user.",
      });
    } finally {
      setLoadingHistory(false);
    }
  };
  const openAddModal = (row) => {
    setSelectedUser(row);
    // default effective date = next Jan 1 (or today). Here we'll propose next Jan 1.
    const today = new Date();
    const nextJan1 =
      today.getMonth() === 0 && today.getDate() === 1
        ? today // already Jan 1
        : new Date(today.getFullYear() + 1, 0, 1); // next Jan 1
    const toISO = (d) => d.toISOString().slice(0, 10);

    setAddForm({
      effective_from: toISO(nextJan1),
      hourly_rate: "",
    });
    setAddModalOpen(true);
  };

   const saveNewRate = async () => {
    const userId = selectedUser?.user_id || selectedUser?.id;
    const effective_from = addForm.effective_from;
    const hourly_rate = Number(String(addForm.hourly_rate).replace(",", "."));

    if (!userId || !effective_from || Number.isNaN(hourly_rate)) {
      return toast.current?.show({
        severity: "warn",
        summary: "Missing/Invalid",
        detail: "Please fill a valid date and hourly rate.",
      });
    }

    setSavingNew(true);
    try {
      await axios.post(`${apiBaseUrl}/rates`, { userId, effective_from, hourly_rate });

      toast.current?.show({
        severity: "success",
        summary: "Created",
        detail: "New hourly rate added.",
      });

      // Refresh rate history (and main list if needed)
      await openRateHistory(selectedUser);
      setAddModalOpen(false);
    } catch (err) {
      console.error("Create rate error:", err);
      toast.current?.show({
        severity: "error",
        summary: "Create failed",
        detail: "Could not add hourly rate.",
      });
    } finally {
      setSavingNew(false);
    }
  };

  // editor template for hourly_rate
  const rateEditor = (options) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => {
          // keep numeric only; allow empty to show validation later if you want
          const v = e.target.value;
          if (/^\d*([.,]\d{0,2})?$/.test(v) || v === "") {
            options.editorCallback(v.replace(",", "."));
          }
        }}
        keyfilter="money"
        placeholder="0.00"
        style={{ width: "100%" }}
      />
    );
  };

  // handle "Save" click in row editor
  const onRowEditComplete = async (e) => {
    const { newData, index } = e; // newData: { user_id, effective_from, hourly_rate, ... }
    const payload = {
      userId: selectedUser?.user_id || selectedUser?.id,
      effective_from: String(newData.effective_from).slice(0, 10), // YYYY-MM-DD
      hourly_rate: Number(newData.hourly_rate),
    };

    if (Number.isNaN(payload.hourly_rate)) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid",
        detail: "Hourly rate must be a number.",
      });
      // cancel UI change by reloading history
      return openRateHistory(selectedUser);
    }

    try {
      await axios.patch(`${apiBaseUrl}/rates`, payload);
      // update local table data
      const next = [...rateHistory];
      next[index] = {
        ...next[index],
        hourly_rate: payload.hourly_rate,
      };
      setRateHistory(next);

      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Hourly rate updated.",
      });
    } catch (err) {
      console.error("Update rate error:", err);
      toast.current?.show({
        severity: "error",
        summary: "Update failed",
        detail: "Could not update hourly rate.",
      });
      // reload to revert UI
      openRateHistory(selectedUser);
    }
  };

  const itemTemplate = (row) => {
    const avatarSrc = row.avatar || defaultAvatarUrl;
    const effective = row.effective_from?.slice(0, 10);
    return (
      <div className="ur-item">
        <img
          className="ur-avatar"
          src={avatarSrc}
          alt={row.username}
          onError={(e) => {
            if (e.currentTarget.dataset.fallback === "1") return;
            e.currentTarget.dataset.fallback = "1";
            e.currentTarget.src = defaultAvatarUrl;
          }}
        />
        <div className="ur-main">
          <div className="ur-name">{row.username}</div>
          <div className="ur-meta">
            <span className="ur-rate">{formatRate(row.hourly_rate)}</span>
            {effective && <span className="ur-since">Ισχύει απο <strong style={{color:"green"}}>{effective}</strong> </span>}
          </div>
        </div>
        
        <div className="ur-actions">
          <Button
            icon="pi pi-plus"
            label="Προσθήκη"
            className="p-button-rounded p-button-text"
            onClick={() => openAddModal(row)}
          />
          <Button
            icon="pi pi-pencil"
            label="Επεξεργασία"
            className="p-button-rounded p-button-text"
            onClick={() => openRateHistory(row)}
          />
        </div>
      </div>
    );
  };

  const rateDialogHeader = (
    <div className="flex align-items-center gap-3">
      <img
        src={(selectedUser && selectedUser.avatar) || defaultAvatarUrl}
        alt={selectedUser?.username || "User"}
        className="ur-avatar"
        width={40}
        height={40}
        onError={(e) => {
          if (e.currentTarget.dataset.fallback === "1") return;
          e.currentTarget.dataset.fallback = "1";
          e.currentTarget.src = defaultAvatarUrl;
        }}
      />
      <div>
        <div className="font-bold">{selectedUser?.username || "User"}</div>
        <div className="text-sm text-500">Hourly Rate History</div>
      </div>
    </div>
  );

  return (
    <div className="card p-4 md:p-6">
      <Toast ref={toast} />
      <div className="ur-header">
        <h2 className="ur-title">Ωρομίσθιο ανά χρήστη</h2>
      </div>

      <DataScroller
        value={data}
        itemTemplate={itemTemplate}
        rows={35}
        buffer={0.5}
        header={loading ? "Loading…" : "Users"}
        className="ur-scroller"
      />

      <Dialog
        header={rateDialogHeader}
        visible={rateModalOpen}
        onHide={() => setRateModalOpen(false)}
        style={{ width: "620px", maxWidth: "95vw" }}
        dismissableMask
      >
        {loadingHistory ? (
          <div className="flex justify-content-center p-5">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable
            value={rateHistory}
            dataKey={(r) => `${r.user_id}-${r.effective_from}`}
            editMode="row"
            onRowEditComplete={onRowEditComplete}
            size="small"
            stripedRows
            emptyMessage="No rate history found."
            className="ur-table"
          >
            <Column
              field="effective_from"
              header="Effective From"
              body={(r) => (r.effective_from ? String(r.effective_from).slice(0, 10) : "—")}
              style={{ width: "40%" }}
            />
            <Column
              field="hourly_rate"
              header="Hourly Rate (€)"
              body={(r) => formatRate(Number(r.hourly_rate))}
              editor={rateEditor}
              style={{ width: "35%" }}
            />
            <Column
              rowEditor
              header="Edit"
              bodyStyle={{ textAlign: "center" }}
              headerStyle={{ width: "120px", textAlign: "center" }}
            />
          </DataTable>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <Button label="Close" onClick={() => setRateModalOpen(false)} />
        </div>
      </Dialog>
      {/* Add modal */}
      <Dialog
        header={`Προσθήκη Ωρομισθίου${selectedUser ? ` – ${selectedUser.username}` : ""}`}
        visible={addModalOpen}
        onHide={() => setAddModalOpen(false)}
        style={{ width: "520px", maxWidth: "95vw" }}
        dismissableMask
      >
        <div className="p-fluid grid formgrid">
          <div className="field col-12">
            <label htmlFor="effective_from">Ημ/νία εφαρμογής</label>
            <input
              id="effective_from"
              type="date"
              className="p-inputtext p-component w-full"
              value={addForm.effective_from}
              onChange={(e) => setAddForm((f) => ({ ...f, effective_from: e.target.value }))}
            />
            <small className="text-500">π.χ. 2026-01-01 (Πρωτοχρονιά)</small>
          </div>

          <div className="field col-12">
            <label htmlFor="hourly_rate">Ωρομίσθιο (€)</label>
            <InputText
              id="hourly_rate"
              value={addForm.hourly_rate}
              onChange={(e) => {
                const v = e.target.value;
                if (/^\d*([.,]\d{0,2})?$/.test(v) || v === "") {
                  setAddForm((f) => ({ ...f, hourly_rate: v }));
                }
              }}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <Button label="Ακύρωση" className="p-button-text" onClick={() => setAddModalOpen(false)} />
          <Button
            label={savingNew ? "Αποθήκευση…" : "Αποθήκευση"}
            onClick={saveNewRate}
            disabled={savingNew}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default UserRates;
