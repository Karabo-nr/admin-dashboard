import React, { useEffect, useMemo, useState } from 'react';
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  usePagination,
  useRowSelect,
  useExpanded,
  useFilters
} from 'react-table';
import { CSVLink } from 'react-csv';
import Modal from 'react-modal';
import Switch from 'react-switch';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ApplicationsDashboard.css';

const STATUSES = ['Pending', 'Approved', 'Rejected'];
Modal.setAppElement('#root');

export default function ApplicationsDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch('https://13.48.10.3:8443/api/applications')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(apps => {
        const rows = apps.map(app => {
          let cvUrl = '';
          if (app.cvFile) {
            try {
              const byteCharacters = atob(app.cvFile);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              cvUrl = URL.createObjectURL(blob);
            } catch (error) {
              console.error('Error converting base64 CV file:', error);
            }
          }
          return {
            id: app.id,
            email: app.email,
            submissionDate: app.submissionDate,
            fullName: app.fullName,
            courseCode: app.courseCode,
            preferredLocation: app.preferredLocation || 'N/A',
            finalYearModules: app.finalYearModules || [],
            applicationStatus: app.applicationStatus,
            cvUrl
          };
        });
        setData(rows);
      })
      .catch(err => {
        console.error('Failed to load applications:', err);
        toast.error('Error loading applications');
      })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (id, newStatus) => {
    fetch(`https://13.48.10.3:8443/api/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(old => old.map(a => (a.id === id ? { ...a, applicationStatus: newStatus } : a)));
        toast.success(`Status updated to "${newStatus}"`);
      })
      .catch(err => {
        console.error('Failed to update status:', err);
        toast.error('Error updating status');
      });
  };

  const bulkUpdate = (newStatus) => {
    const ids = selectedFlatRows.map(r => r.original.id);
    Promise.all(
      ids.map(id =>
        fetch(`https://13.48.10.3:8443/api/applications/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })
      )
    )
      .then(() => {
        setData(old => old.map(a => (ids.includes(a.id) ? { ...a, applicationStatus: newStatus } : a)));
        toast.success(`Bulk ${newStatus.toLowerCase()} successful`);
      })
      .catch(err => {
        console.error(`Bulk ${newStatus} error:`, err);
        toast.error(`Failed bulk ${newStatus.toLowerCase()}`);
      });
  };

  const columns = useMemo(() => [
    {
      Header: 'Select',
      id: 'selection',
      Cell: ({ row }) => <input type="checkbox" {...row.getToggleRowSelectedProps()} />
    },
    { Header: 'ID', accessor: 'id' },
    { Header: 'Email', accessor: 'email' },
    {
      Header: 'Date',
      accessor: 'submissionDate',
      Cell: ({ value }) => new Date(value).toLocaleDateString()
    },
    { Header: 'Name', accessor: 'fullName' },
    { Header: 'Course', accessor: 'courseCode' },
    { Header: 'Preferred Location', accessor: 'preferredLocation' },
    {
      Header: 'Average',
      id: 'avgMark',
      accessor: row => {
        const marks = row.finalYearModules.map(m => m.mark || 0);
        return marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1) : '0.0';
      }
    },
    {
      Header: 'CV',
      accessor: 'cvUrl',
      Cell: ({ value }) => value ? <a href={value} download>Download</a> : 'N/A',
      disableSortBy: true
    },
    {
      Header: 'Status',
      accessor: 'applicationStatus',
      Filter: SelectColumnFilter,
      filter: 'equals',
      Cell: ({ row, value }) => (
        <select value={value} onChange={e => updateStatus(row.original.id, e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    },
    {
      Header: '',
      id: 'expander',
      Cell: ({ row }) => <span {...row.getToggleRowExpandedProps()}>{row.isExpanded ? '▼' : '▶'}</span>
    }
  ], []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    rows,
    prepareRow,
    state,
    setGlobalFilter,
    setFilter,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage,
    pageOptions,
    gotoPage,
    setPageSize,
    selectedFlatRows,
    state: { pageIndex, pageSize, globalFilter }
  } = useTable(
    { columns, data, initialState: { pageIndex: 0, pageSize: 5 } },
    useFilters,
    useGlobalFilter,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect
  );

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className={darkMode ? 'dashboard dark' : 'dashboard'}>
      <div className="dashboard-card">
        <header className="dashboard-header">
          <h1>Applications Dashboard</h1>
          <div className="controls">
            <input
              className="ctrl-search"
              value={globalFilter || ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="🔍 Search…"
            />
            <select
              className="ctrl-filter"
              value={state.filters?.find(f => f.id === 'applicationStatus')?.value || ''}
              onChange={e => setFilter('applicationStatus', e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <CSVLink data={rows.map(r => r.original)} filename="applications.csv" className="btn">Export CSV</CSVLink>
            <button onClick={() => window.print()} className="btn">Print</button>
            <label className="dark-toggle">
              <Switch
                onChange={setDarkMode}
                checked={darkMode}
                offColor="#ccc"
                onColor="#333"
                uncheckedIcon={false}
                checkedIcon={false}
              />
              Dark
            </label>
          </div>
        </header>

        <div className="table-wrapper">
          <table {...getTableProps()} className="apps-table">
            <thead>
              {headerGroups.map(hg => (
                <tr key={hg.id} {...hg.getHeaderGroupProps()}>
                  {hg.headers.map(col => (
                    <th key={col.id} {...col.getHeaderProps(col.getSortByToggleProps())}>
                      {col.render('Header')}
                      <span className="sort-indicator">
                        {col.isSorted ? (col.isSortedDesc ? ' ▼' : ' ▲') : ''}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map(row => {
                prepareRow(row);
                return (
                  <React.Fragment key={row.id}>
                    <tr key={row.id} {...row.getRowProps()}>
                      {row.cells.map(cell => (
                        <td key={cell.column.id} {...cell.getCellProps()}>{cell.render('Cell')}</td>
                      ))}
                    </tr>
                    {row.isExpanded && (
                      <tr className="expanded-row">
                        <td colSpan={columns.length}>
                          <strong>Modules:</strong>
                          <ul>
                            {row.original.finalYearModules.map(m => (
                              <li key={m.id}>{`${m.moduleName}: ${m.mark}`}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>{'«'}</button>
          <button onClick={previousPage} disabled={!canPreviousPage}>{'‹'}</button>
          <span>Page {pageIndex + 1} of {pageOptions.length}</span>
          <button onClick={nextPage} disabled={!canNextPage}>{'›'}</button>
          <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage}>{'»'}</button>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
            {[5, 10, 20].map(sz => <option key={sz} value={sz}>Show {sz}</option>)}
          </select>
          <button onClick={() => bulkUpdate('Approved')} disabled={!selectedFlatRows.length}>Bulk Approve</button>
          <button onClick={() => bulkUpdate('Rejected')} disabled={!selectedFlatRows.length}>Bulk Reject</button>
        </div>

        <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar />
      </div>
    </div>
  );
}

function SelectColumnFilter({ column: { filterValue, setFilter, id, preFilteredRows } }) {
  const options = useMemo(() => {
    const setOpts = new Set(preFilteredRows.map(row => row.values[id]));
    return [...setOpts];
  }, [id, preFilteredRows]);

  return (
    <select
      value={filterValue}
      onChange={e => setFilter(e.target.value || undefined)}
      className="ctrl-filter-inline"
    >
      <option value="">All</option>
      {options.map((o, i) => (
        <option key={i} value={o}>{o}</option>
      ))}
    </select>
  );
}