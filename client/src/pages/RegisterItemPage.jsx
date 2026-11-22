import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RegisterItemPage() {
  const navigate=useNavigate(); const [form,setForm]=useState({name:'',description:'',category:'SAMPLE',reason:''}); const [error,setError]=useState('');
  const submit=async(event)=>{event.preventDefault();setError('');try{const {data}=await api.post('/items',form);navigate(`/items/${data.id}`)}catch(err){setError(err.response?.data?.error?.details?.map(d=>d.message).join(', ')||err.response?.data?.error?.message||'Unable to register item.')}};
  return <section className="card"><h1>Register item</h1>{error&&<p className="error">{error}</p>}<form onSubmit={submit}>
    <label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><br/><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>SAMPLE</option><option>EVIDENCE</option><option>EQUIPMENT</option></select></label><br/><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><br/><label>Reason<textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></label><br/><button type="submit">Register</button>
  </form></section>;
}
