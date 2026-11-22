import { useEffect, useState } from 'react';
import api from '../api/axios.js';

export default function AccessLogsPage() {
  const [data,setData]=useState([]);const [meta,setMeta]=useState({page:1,totalPages:1,total:0});const [page,setPage]=useState(1);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{setLoading(true);api.get('/audit/access-logs',{params:{page,pageSize:20}}).then(r=>{setData(r.data.data);setMeta(r.data.meta)}).catch(e=>setError(e.response?.data?.error?.message||'Unable to load audit logs.')).finally(()=>setLoading(false))},[page]);
  return <section><h1>Access logs</h1>{loading&&<div className="card">Loading…</div>}{error&&<div className="card error">{error}</div>}<div className="card"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Outcome</th><th>Request</th></tr></thead><tbody>{data.map((row,i)=><tr key={row._id||i}><td>{row.ts?new Date(row.ts).toLocaleString():''}</td><td>{row.userId||'—'}</td><td>{row.action}</td><td>{row.outcome}</td><td>{row.requestId||'—'}</td></tr>)}</tbody></table>{!loading&&!data.length&&<p>No access logs.</p>}</div><div className="row"><button disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {meta.page} of {meta.totalPages}</span><button disabled={page>=meta.totalPages} onClick={()=>setPage(page+1)}>Next</button></div></section>;
}
