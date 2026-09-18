'use client';
import { useState } from 'react';
export default function NoteActions() {
  const [path,setPath] = useState('');
  const [content,setContent] = useState('');
  const [message,setMessage] = useState('');
  async function act(operation: string, args: object = { path, content }) {
    try {
      const response = await fetch('/api/vault', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({operation,args}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(`${operation}: ${result.to || result.assetPath || result.path || 'done'}`);
      if (result.to) setPath(result.to);
    } catch(error) { setMessage(String(error)); }
  }
  return <details className="mb-4 rounded border p-3"><summary>Write, attach, archive or restore a note</summary>
    <label className="block">Relative file path<input className="block w-full border p-2" value={path} onChange={e=>setPath(e.target.value)} placeholder="raw/my-note.md" /></label>
    <button className="m-2 underline" onClick={async()=>{try { const r=await fetch('/api/files/'+encodeURIComponent(path));const d=await r.json();if(!r.ok)throw Error(d.error);setContent(d.rawContent);setMessage('Loaded');}catch(e){setMessage(String(e));}}}>Load for editing</button>
    <textarea aria-label="Markdown" className="block w-full border p-2" rows={8} value={content} onChange={e=>setContent(e.target.value)} />
    {['create','update','archive','restore'].map(op=><button key={op} className="m-2 rounded border p-2" onClick={()=> {if(op==='update' && !confirm('Replace the text of this note?'))return;void act(op);}}>{op}</button>)}
    <label className="block">Attach file<input type="file" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>void act('attach',{markdownPath:path,name:file.name,dataBase64:String(reader.result).split(',')[1]});reader.readAsDataURL(file);}} /></label>
    <p role="status">{message}</p>
  </details>;
}
