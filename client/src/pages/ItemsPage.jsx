import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function ItemsPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]); const [meta, setMeta] = useState({page:1,totalPages:1,total:0});
  const [filters, setFilters] = useState({ status:'', category:'', q:'', mine:false, page:1, pageSize:20, sort:'created_at', order:'desc' });
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { const {data} = await api.get('/items', {params:{...filters, mine:filters.mine?'true':'false'}}); setItems(data.data); setMeta(data.meta); }
    catch (err) { setError(err.response?.data?.error?.message || 'Unable to load items.'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filters.page, filters.pageSize, filters.status, filters.category, filters.mine, filters.sort, filters.order]);
  const change = (event) => setFilters({...filters,[event.target.name]:event.target.type==='checkbox'?event.target.checked:event.target.value,page:1});
  return <section>
    <div className="toolbar"><div><h1>Items</h1><p className="muted">{meta.total} matching records</p></div>{hasPermission('item:create') && <Link className="button" to="/items/new">Register item</Link>}</div>
    <div className="card toolbar">
      <input name="q" value={filters.q} onChange={change} placeholder="Search item code or name" />
      <button onClick={load}>Search</button>
      <select name="status" value={filters.status} onChange={change}><option value="">All statuses</option>{['COLLECTED','IN_TRANSIT','IN_ANALYSIS','STORED','DISPOSED'].map(v=><option key={v}>{v}</option>)}</select>
      <select name="category" value={filters.category} onChange={change}><option value="">All categories</option>{['SAMPLE','EVIDENCE','EQUIPMENT'].map(v=><option key={v}>{v}</option>)}</select>
      <label><input type="checkbox" name="mine" checked={filters.mine} onChange={change} /> Mine</label>
      <select name="sort" value={filters.sort} onChange={change}><option value="created_at">Created</option><option value="item_code">Item code</option><option value="status">Status</option></select>
      <select name="order" value={filters.order} onChange={change}><option value="desc">Descending</option><option value="asc">Ascending</option></select>
    </div>
    {loading && <div className="card">Loading…</div>}{error && <div className="card error">{error}</div>}
    {!loading && !error && !items.length && <div className="card">No items match these filters.</div>}
    {!!items.length && <div className="card"><table><thead><tr><th>Code</th><th>Name</th><th>Status</th><th>Category</th><th>Custodian</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><Link to={`/items/${item.id}`}>{item.itemCode}</Link></td><td>{item.name}</td><td>{item.status}</td><td>{item.category}</td><td>{item.currentCustodian?.name || '—'}</td></tr>)}</tbody></table></div>}
    <div className="row"><button disabled={filters.page<=1} onClick={()=>setFilters({...filters,page:filters.page-1})}>Previous</button><span>Page {meta.page} of {meta.totalPages}</span><button disabled={filters.page>=meta.totalPages} onClick={()=>setFilters({...filters,page:filters.page+1})}>Next</button></div>
  </section>;
}
