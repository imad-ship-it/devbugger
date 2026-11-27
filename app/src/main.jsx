import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowRight, ArrowUpRight, BookOpen, Braces, Bug, Check, ChevronRight,
  Clock3, Crosshair, FileText, FlaskConical, GitFork, Layers3, LoaderCircle,
  ScanLine, TriangleAlert,
} from 'lucide-react';
import '@fontsource-variable/dm-sans';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './style.css';
import Specimen from './Specimen.jsx';

const REPO = 'https://github.com/imad-ship-it/devbugger';
const categories = {
  API_Error: ['API error', 'Request routing, response handling or data format.'],
  Authentication: ['Authentication', 'Identity, sign-in or credential handling.'],
  CORS_Error: ['CORS error', 'Cross-origin requests and browser access rules.'],
  Database_Connection: ['Database connection', 'Connectivity between the application and its database.'],
  State_Management: ['State management', 'How the application tracks and updates state.'],
};
const blank = { title: '', body: '', source: 'GitHub' };
const sources = ['GitHub', 'Stack Overflow'];
const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

async function request(path, options) {
  const response = await fetch(path, options);
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Cannot reach the prediction service. Check that the local server is running.');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request failed. Please try again.');
  return data;
}

function Header({ view }) {
  return <header className="site-header"><div className="shell header-inner">
    <a className="brand" href="#analyzer" aria-label="DevBugger home"><span className="brand-mark"><Bug size={23} /></span>DevBugger<span className="brand-period">.</span></a>
    <nav aria-label="Workspace">
      <a className={view === 'analyzer' ? 'active' : ''} href="#analyzer" aria-current={view === 'analyzer'?'page':undefined}><ScanLine size={16}/> Analyzer</a>
      <a className={view === 'models' ? 'active' : ''} href="#models" aria-current={view === 'models'?'page':undefined}><BookOpen size={16}/> Model notes</a>
    </nav>
    <a className="repo" href={REPO} target="_blank" rel="noreferrer"><GitFork size={16}/> <span>Repository</span> <ArrowUpRight size={13}/></a>
  </div></header>;
}

function Banner({ models }) {
  return <section className="banner"><div className="banner-copy">
    <div className="overline banner-label"><i/> MERN TRIAGE LAB</div>
    <h1>{models ? 'Model notes' : 'Bug report analyzer'}</h1>
    <p>{models ? 'How the two models make predictions and how they performed on unseen reports.' : 'Turn a bug report into a predicted category and an estimated resolution time.'}</p>
  </div><div className="banner-art"><Specimen/></div></section>;
}

function SourceIcon({ source, size = 16 }) {
  return source === 'GitHub' ? <GitFork size={size}/> : <Layers3 size={size}/>;
}

function EmptyResult() {
  return <div className="empty-result">
    <div className="scan-glyph"><i/><i/><i/><i/><Activity size={36} strokeWidth={1.6}/></div>
    <h3>Awaiting report</h3>
    <p>Your predicted bug type and time estimate will appear here.</p>
  </div>;
}

function Result({ result, busy }) {
  return <section className="card result-card" aria-label="Prediction results">
    <div className="card-heading"><div className="card-title"><span className="icon-tile"><Activity size={19}/></span><h2>Prediction</h2></div>
      <span className={'result-tag ' + (result ? 'complete' : '')}><i/>{busy?'Running':result?'Complete':'Standby'}</span>
    </div>
    <div aria-live="polite" aria-atomic="true">
      {busy ? <div className="empty-result"><LoaderCircle size={35} className="spin"/><h3>Analyzing report</h3><p>Running both model pipelines.</p></div>
        : result ? <div className="result-body">
          <div className="overline"><Crosshair size={14}/> PREDICTED CATEGORY</div>
          <h3>{categories[result.bug_type]?.[0] || result.bug_type}</h3>
          <p>{categories[result.bug_type]?.[1]}</p>
          <div className="duration"><div className="overline"><Clock3 size={14}/> ESTIMATED TIME</div><strong>{fmt.format(result.estimated_hours)} <small>hours</small></strong>
          <p>Until {result.source === 'GitHub' ? 'GitHub issue closure' : 'the accepted answer is posted'}.</p></div>
        </div> : <EmptyResult/>}
    </div>
    <div className="pipeline"><span className="model-dot"/> Linear SVM <ArrowRight size={13}/> Decision Tree</div>
  </section>;
}

function Evaluation() {
  return <section className="evaluation"><div className="eval-heading"><div className="overline">HELD-OUT EVALUATION</div><a href="#models" aria-label="View model evaluation notes"><ArrowUpRight size={17}/></a></div>
    <div className="metrics"><div><strong>91.88<span>%</span></strong><p>Classification accuracy</p></div><div><strong>3,654 <span>h</span></strong><p>Mean absolute time error</p></div></div>
  </section>;
}

function ModelNotes() {
  return <div className="notes-grid">
    <section className="card notes-card"><div className="card-title"><span className="icon-tile"><Braces size={19}/></span><h2>Prediction pipeline</h2></div>
      <h3>Linear SVM</h3><p>Uses the title, description, source and filing-time clues to select one of five categories.</p>
      <div className="class-chips">{Object.entries(categories).map(([key,[name]])=><span key={key}>{name}</span>)}</div>
      <h3>Decision Tree</h3><p>Receives the report features and predicted category, then returns elapsed hours. The tree was trained on log-transformed durations. Its first split separates the two sources.</p>
    </section>
    <section className="card notes-card"><div className="card-title"><span className="icon-tile"><FlaskConical size={19}/></span><h2>Test results</h2></div>
      <h3>147 correct out of 160</h3><p>The experiment reserved 160 of 800 reports for testing. The linear SVM achieved 0.9199 weighted F1. All 13 classification mistakes involved API errors.</p>
      <h3>Time estimates vary widely</h3><p>The tree’s average absolute miss was 3,654 hours. Its test RMSE was 8,894 hours. A simple average for each platform scored 8,107 hours on that metric.</p>
      <p className="note-callout">GitHub tracks time to issue closure. Stack Overflow tracks time until the accepted answer was posted. Both include waiting.</p>
    </section>
  </div>;
}

function App() {
  const currentView = () => window.location.hash === '#models' ? 'models' : 'analyzer';
  const [view, setView] = useState(currentView);
  const [report, setReport] = useState(blank);
  const [result, setResult] = useState(null);
  const [exampleUrl, setExampleUrl] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [online, setOnline] = useState(null);
  const titleRef = useRef(null);
  const resultsRef = useRef(null);
  useEffect(() => {
    if (result && window.matchMedia('(max-width: 720px)').matches) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
    }
  }, [result]);
  useEffect(() => {
    const change = () => {setView(currentView()); window.scrollTo(0, 0);};
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    let active = true;
    const ping = () => request('/api/status').then(data => {if(active) setOnline(data.ready);}).catch(() => {if(active) setOnline(false);});
    ping();
    const timer = setInterval(ping,30000);
    return () => {active = false;clearInterval(timer);};
  }, []);
  function setField(field,value) {
    setReport({...report,[field]:value});setResult(null);setError('');setExampleUrl('');
  }
  async function loadExample() {
    setBusy('example');setError('');
    try {
      const {title,body,source,url} = await request('/api/example');
      setReport({title,body,source});setExampleUrl(url);setResult(null);setOnline(true);
    } catch (err) {setError(err.message);}
    finally {setBusy('');}
  }
  async function analyze(event) {
    event.preventDefault();
    if(!report.title.trim() && !report.body.trim()) {
      setError('Enter a report title or description first.');titleRef.current?.focus();return;
    }
    setBusy('predict');setError('');setResult(null);
    try {
      const data = await request('/api/predict', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
      setResult({...data,source:report.source});setOnline(true);
    } catch (err) {setError(err.message);}
    finally {setBusy('');}
  }
  return <><Header view={view}/><main className="shell">
    <div className="context"><div className="crumb">Workspace <ChevronRight size={13}/> <b>{view==='models'?'Model notes':'Analyzer'}</b></div>
    <span className={'health '+(online===true?'is-online':'')}><i/>{online===null?'Connecting':online?'Models online':'Service offline'}</span></div>
    <Banner models={view==='models'}/>
    {view === 'models' ? <ModelNotes/> : <div className="workspace">
      <section className="card form-card"><div className="card-heading">
        <div className="card-title"><span className="icon-tile"><FileText size={19}/></span><h2>Report input</h2></div>
        <button type="button" className="example-button" onClick={loadExample} disabled={!!busy}><FlaskConical size={15}/>{busy==='example'?'Loading…':'Load example'}</button>
      </div><form onSubmit={analyze}>
        <fieldset disabled={!!busy}><legend>Report source</legend><div className="sources">{sources.map(s=><label className={report.source===s?'source selected':'source'} key={s}>
          <input type="radio" name="source" value={s} checked={report.source===s} onChange={()=>setField('source',s)}/>
          <SourceIcon source={s}/>{s}<span className="radio-mark">{report.source===s&&<Check size={10} strokeWidth={3}/>}</span>
        </label>)}</div></fieldset>
        <div className="field"><label htmlFor="title">Report title</label><input id="title" ref={titleRef} value={report.title} placeholder="e.g. Login request returns a 401 after token refresh" onChange={e=>setField('title',e.target.value)} disabled={!!busy}/></div>
        <div className="field"><label htmlFor="body">Description</label><textarea id="body" rows="4" value={report.body} placeholder="Describe what happened. Include any error messages, stack traces or steps to reproduce." onChange={e=>setField('body',e.target.value)} disabled={!!busy}/></div>
        {exampleUrl && <a className="example-source" href={exampleUrl} target="_blank" rel="noreferrer">View original GitHub issue <ArrowUpRight size={13}/></a>}
        {error && <p className="error" role="alert"><TriangleAlert size={16}/>{error}</p>}
        <button className="analyze" disabled={!!busy} type="submit">{busy==='predict'?<LoaderCircle className="spin" size={17}/>:<ScanLine size={17}/>} {busy==='predict'?'Analyzing…':'Analyze report'}<ArrowRight size={17}/></button>
      </form></section>
      <aside ref={resultsRef}><Result result={result} busy={busy==='predict'}/><Evaluation/></aside>
    </div>}
    <footer><span><Bug size={15}/> DevBugger</span><span>Machine Learning Fundamentals</span></footer>
  </main></>;
}

createRoot(document.getElementById('root')).render(<App/>);
