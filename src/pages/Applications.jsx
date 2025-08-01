// src/pages/ApplicationsDashboard.jsx
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

// statuses
const STATUSES = ['Pending', 'Approved', 'Rejected'];

// ——————————————————————————————
// MOCK DATA
// ——————————————————————————————
const MOCK_APPS = [
  {
    id: 1,
    applicationId: 'DSA-100001',
    submissionDate: '2025-07-10',
    fullName: 'Alice Moyo',
    courseCode: 'DSA101',
    finalYearModules: [
      { id: 101, moduleName: 'AI Basics', mark: 85 },
      { id: 102, moduleName: 'Data Wrangling', mark: 90 }
    ],
    applicationStatus: 'Pending',
    cvUrl: '/mock-cvs/alice-moyo.pdf'
  },
  {
    id: 2,
    applicationId: 'DSA-100002',
    submissionDate: '2025-07-11',
    fullName: 'Brian Nkosi',
    courseCode: 'DSA102',
    finalYearModules: [
      { id: 201, moduleName: 'Statistics', mark: 78 },
      { id: 202, moduleName: 'Machine Learning', mark: 82 }
    ],
    applicationStatus: 'Approved',
    cvUrl: '/mock-cvs/brian-nkosi.pdf'
  },
  {
    id: 3,
    applicationId: 'DSA-100003',
    submissionDate: '2025-07-12',
    fullName: 'Clara Dlamini',
    courseCode: 'DSA103',
    finalYearModules: [
      { id: 301, moduleName: 'Big Data', mark: 88 }
    ],
    applicationStatus: 'Rejected',
    cvUrl: '/mock-cvs/clara-dlamini.pdf'
  }
];

Modal.setAppElement('#root');

export default function ApplicationsDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // simulate fetch
  useEffect(() => {
    setTimeout(() => {
      setData(MOCK_APPS);
      setLoading(false);
    }, 500);
  }, []);

  const updateStatus = (id, newStatus) => {
    setData(old => old.map(a => a.id === id ? { ...a, applicationStatus: newStatus } : a));
    toast.success(`Status set to “${newStatus}”`);
  };

  const columns = useMemo(() => [
    {
      Header: 'Select',
      id: 'selection',
      Cell: ({ row }) => <input type="checkbox" {...row.getToggleRowSelectedProps()} />
    },
    { Header: 'ID', accessor: 'id' },
    { Header: 'App. ID', accessor: 'applicationId' },
    {
      Header: 'Date',
      accessor: 'submissionDate',
      Cell: ({ value }) => new Date(value).toLocaleDateString()
    },
    { Header: 'Name', accessor: 'fullName' },
    { Header: 'Course', accessor: 'courseCode' },
    {
      Header: '# Modules',
      id: 'numModules',
      accessor: row => row.finalYearModules.length
    },
    {
      Header: 'Average',
      id: 'avgMark',
      accessor: row => {
        const marks = row.finalYearModules.map(m => m.mark);
        return (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1);
      }
    },
    {
      Header: 'CV',
      accessor: 'cvUrl',
      Cell: ({ value }) => <a href={value} download>Download</a>,
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

  const bulkApprove = () => {
    const ids = selectedFlatRows.map(r => r.original.id);
    setData(old => old.map(a => ids.includes(a.id) ? { ...a, applicationStatus: 'Approved' } : a));
    toast.success('Bulk approved');
  };

  const bulkReject = () => {
    const ids = selectedFlatRows.map(r => r.original.id);
    setData(old => old.map(a => ids.includes(a.id) ? { ...a, applicationStatus: 'Rejected' } : a));
    toast.info('Bulk rejected');
  };

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
            value={state.filters?.find(f => f.id==='applicationStatus')?.value || ''}
            onChange={e => setFilter('applicationStatus', e.target.value || undefined)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <CSVLink data={page} filename="applications.csv" className="btn">Export CSV</CSVLink>
          <button onClick={() => window.print()} className="btn">Print</button>
          <label className="dark-toggle">
            <Switch onChange={setDarkMode} checked={darkMode}
              offColor="#ccc" onColor="#333" uncheckedIcon={false} checkedIcon={false}/>
            Dark
          </label>
        </div>
      </header>

        <div className="table-wrapper">
      <table {...getTableProps()} className="apps-table">
        <thead>
          {headerGroups.map(hg => (
            <tr {...hg.getHeaderGroupProps()}>
              {hg.headers.map(col => (
                <th
                  {...col.getHeaderProps(col.getSortByToggleProps())}
                  className={col.isSorted ? (col.isSortedDesc ? 'sorted-desc' : 'sorted-asc') : ''}
                >
                  {col.render('Header')}
                  <span className="sort-indicator">{col.isSorted ? (col.isSortedDesc ? ' ▼' : ' ▲') : ''}</span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map(row => {
            prepareRow(row);
            return (
              <React.Fragment key={row.getRowProps().key}>
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => <td {...cell.getCellProps()}>{cell.render('Cell')}</td>)}
                </tr>
                {row.isExpanded && (
                  <tr className="expanded-row">
                    <td colSpan={columns.length}>
                      <strong>Modules:</strong>
                      <ul>
                        {row.original.finalYearModules.map(m =>
                          <li key={m.id}>{`${m.moduleName}: ${m.mark}`}</li>
                        )}
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
        <span>Page {pageIndex+1} of {pageOptions.length}</span>
        <button onClick={nextPage} disabled={!canNextPage}>{'›'}</button>
        <button onClick={() => gotoPage(pageOptions.length-1)} disabled={!canNextPage}>{'»'}</button>
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
          {[5,10,20].map(sz => <option key={sz} value={sz}>Show {sz}</option>)}
        </select>
        <button onClick={bulkApprove} disabled={!selectedFlatRows.length}>Bulk Approve</button>
        <button onClick={bulkReject} disabled={!selectedFlatRows.length}>Bulk Reject</button>
      </div>

      <ToastContainer position="bottom-right" autoClose={2000} hideProgressBar />
    </div>
   </div>
  );
}

// simple enum filter dropdown
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
      {options.map((o,i) => <option key={i} value={o}>{o}</option>)}
    </select>
  );
}
