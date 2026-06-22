import { useState, useMemo, useEffect, useRef } from "react";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
// ใช้เวลาไทย UTC+7
function getTodayTH() {
  const th = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return th.toISOString().slice(0, 10);
}
const TODAY_STR = getTodayTH();

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.floor((d - TODAY) / 86400000);
}
function expiryStatus(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return "none";
  if (days < 0)  return "expired";
  if (days <= 90) return "warning";
  return "ok";
}

// แสดงวันหมดอายุในรูปแบบ ค.ศ. DD/MM/YYYY
function formatExpiry(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}


const EXP_COLORS = {
  expired: { bg:"#FEE2E2", text:"#B91C1C", badge:"#EF4444", label:"หมดอายุแล้ว" },
  warning: { bg:"#FEF3C7", text:"#92400E", badge:"#F59E0B", label:"ใกล้หมดอายุ" },
  ok:      { bg:"#ECFDF5", text:"#065F46", badge:"#10B981", label:"ปกติ" },
  none:    { bg:"#F9FAFB", text:"#374151", badge:"#9CA3AF", label:"-" },
};
const EQ_BTN = {
  complete:{ bg:"#ECFDF5", text:"#065F46", border:"#6EE7B7", label:"✓ ครบ" },
  damaged: { bg:"#FEE2E2", text:"#B91C1C", border:"#FCA5A5", label:"✗ ชำรุด" },
};
const AMB_STATUS_OPTIONS = ["พร้อมใช้งาน","ซ่อมบำรุง","ไม่พร้อม"];
const AMB_STATUS_STYLE = {
  "พร้อมใช้งาน":{ dot:"#10B981", bg:"#ECFDF5", text:"#065F46" },
  "ซ่อมบำรุง":  { dot:"#F59E0B", bg:"#FEF3C7", text:"#92400E" },
  "ไม่พร้อม":   { dot:"#EF4444", bg:"#FEE2E2", text:"#B91C1C" },
};
const FUEL_LEVELS = ["เต็ม (F)","3/4","1/2","1/4","ต่ำ (E)"];
const FUEL_COLOR  = { "เต็ม (F)":"#10B981","3/4":"#10B981","1/2":"#F59E0B","1/4":"#EF4444","ต่ำ (E)":"#B91C1C" };
const MONTHS_TH   = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

// ─── รายการ 33 รายการ ───────────────────────────────────────
const REAL_ITEMS = [
  [  1,"Hard collar ผู้ใหญ่/เด็ก",                          null,      "2,1",  "ชิ้น",    false],
  [  2,"O2 mask with bag เด็ก",                             "2025-09", "1",    "ชิ้น",    true ],
  [  3,"O2 mask with bag ผู้ใหญ่",                          "2026-07", "1",    "ชิ้น",    true ],
  [  4,"O2 canular ผู้ใหญ่",                                "2026-09", "2",    "ชิ้น",    true ],
  [  5,"Set พ่นยา เด็ก",                                    "2025-08", "1",    "ชุด",     true ],
  [  6,"Set พ่นยา ผู้ใหญ่",                                 "2026-09", "1",    "ชุด",     true ],
  [  7,'Conform 3", 4" (ม้วน)',                             "2025-09", "2,2",  "ม้วน",    true ],
  [  8,'EB 4", 6" (ม้วน)',                                  "2026-08", "3,3",  "ม้วน",    true ],
  [  9,"Mask (กล่อง)",                                      "2026-07", "1",    "กล่อง",   true ],
  [ 10,'Top Gauze 12"x12"',                                 "2026-01", "5",    "แผ่น",    true ],
  [ 11,"เครื่องวัด BP / Suction",                           null,      "1,1",  "เครื่อง", false],
  [ 12,"ถุงมือ ขนาด S,M,L (กล่อง)",                        "2025-02", "1,1,1","กล่อง",   true ],
  [ 13,"Aqua pack 1 อัน (กระปุกน้ำ)",                      "2026-02", "1",    "อัน",     true ],
  [ 14,"Mask N95 (ชิ้น)",                                   "2026-12", "5",    "ชิ้น",    true ],
  [ 15,"Armsling S,M,L / กล่อง",                            null,      "1,1,1","กล่อง",   false],
  [ 16,"น้ำตาล/เกลือแร่/ไม้กดแล้ง/ชา (อย่างละ≥2อัน)",     null,      "4,4",  "ชิ้น",    false],
  [ 17,"SAM pelvic Sling (ที่รัดกระดูกเชิงกราน)",           null,      "1",    "ชุด",     false],
  [ 18,"ชุด PPE level C / ชุด CPE ฟ้า",                    null,      "5,5",  "ชุด",     false],
  [ 19,"อุปกรณ์ Stop Bleed",                                null,      "2",    "ชุด",     false],
  [ 20,"ถุงขยะติดเชื้อ (ถุงแดง)",                           null,      "10",   "ใบ",      false],
  [ 21,"เพาเวอร์แบงค์ + อุปกรณ์ CPR + พื้นแขวนกระชับ",    null,      "/",    "✓",       false],
  [ 22,"ติดตั้งวิทยุคมนาคม ระบบ VHF/FM",                   null,      "/",    "✓",       false],
  [ 23,"Blue Pad จำนวน 10 ชิ้น",                            null,      "/",    "✓",       false],
  [ 24,"ติดตั้งเครื่องดับเพลิง ≥10 ปอนด์",                 null,      "/",    "✓",       false],
  [ 25,"มี long spinal board (หมอน+สายรัด)",                null,      "/",    "✓",       false],
  [ 26,"มีเบาะยกตามแขน ขา จำนวน 1 ชุด",                    null,      "/",    "✓",       false],
  [ 27,"น้ำยาฆ่าเชื้อและแผ่นปิดแผ่นเชื้อ",                null,      "/",    "✓",       false],
  [ 28,"มีเปล Scoop Stretcher (พร้อมสายรัด≥2-3เส้น)",      null,      "/",    "✓",       false],
  [ 29,"O2 ถังใหญ่ 1",                                     null,      ">500", "ลิตร",    false],
  [ 30,"O2 ถังใหญ่ 2 (เฉพาะรถเบอร์ 1,5,6)",               null,      ">500", "ลิตร",    false],
  [ 31,"O2 ถังเล็ก",                                       null,      ">500", "ลิตร",    false],
  [ 32,"Wheelchair ไฟฟ้า / อุปกรณ์/แบตเตอรี่",             null,      "1",    "ชุด",     false],
  [ 33,"Grid Map 1,2",                                      null,      "1,1",  "แผ่น",    false],
];

function makeEquipment() {
  return REAL_ITEMS.filter(i=>!i[5]).map(i=>({ id:"e"+i[0], no:i[0], name:i[1], stdQty:i[3], unit:i[4], eq_status:"complete", note:"" }));
}
function makeMedications() {
  return REAL_ITEMS.filter(i=>i[5]).map(i=>{
    const [y,m]=i[2].split("-");
    const lastDay=new Date(Number(y),Number(m),0).getDate();
    return { id:"m"+i[0], no:i[0], name:i[1], stdQty:i[3], unit:i[4], qty:i[3], expiry:`${y}-${m.padStart(2,"0")}-${String(lastDay).padStart(2,"0")}` };
  });
}

// ─── 7 คัน ALS ทั้งหมด ───────────────────────────────────────
const CREW_LIST = [
  {no:1,name:"สวัสดิ์"},{no:2,name:"ณัฐชานนท์"},{no:3,name:"กิตติชัย"},
  {no:4,name:"ธีรศักดิ์"},{no:5,name:"เดชชาติ"},{no:6,name:"เดชา"},{no:7,name:"อัครเดช"},
];

function makeAmb({no,name}) {
  return {
    id:`AM-00${no}`, no, licensePlate:`รถเบอร์ ${no}`, type:"ALS",
    status:"พร้อมใช้งาน", crew:name, notes:"",
    equipment:makeEquipment(), medications:makeMedications(),
    // inspectionLogs: บันทึกรายวัน
    // monthlyAcks: { "YYYY-MM": { supervisor, ackTime } } — ผู้ควบคุมงานรับทราบรายเดือน
    inspectionLogs:[], monthlyAcks:{},
  };
}
const AMBULANCES_INIT = CREW_LIST.map(makeAmb);

function snapshotEq(eq) { return eq.map(e=>({id:e.id,no:e.no,name:e.name,eq_status:e.eq_status,note:e.note})); }
function snapshotMed(med){ return med.map(m=>({id:m.id,no:m.no,name:m.name,qty:m.qty,expiry:m.expiry,expStatus:expiryStatus(m.expiry)})); }
function monthKey(year,month){ return `${year}-${String(month).padStart(2,"0")}`; }
function getMonthLogs(logs,year,month){ return logs.filter(l=>l.date.startsWith(monthKey(year,month))); }

// ─── Compact components ───────────────────────────────────────
function Pill({bg,text,label}){ return <span style={{background:bg,color:text,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>; }

export default function App() {
  const [ambulances, setAmbulances] = useState(AMBULANCES_INIT);
  const [selectedId, setSelectedId]   = useState("AM-001");
  const [activeTab, setActiveTab]     = useState("daily");
  const [storageReady, setStorageReady] = useState(false); // โหลดข้อมูลแล้วหรือยัง
  const [saveStatus, setSaveStatus]   = useState(""); // "saving" | "saved" | "error"
  // daily form
  const [dailyForm, setDailyForm] = useState({inspector:"",mileage:"",fuel:"เต็ม (F)",notes:""});
  // crew ack modal (daily)
  const [crewAckModal, setCrewAckModal] = useState(null);
  const [crewAckInput, setCrewAckInput] = useState("");
  // monthly supervisor ack modal
  const [monthAckModal, setMonthAckModal] = useState(null);
  const [supervisorInput, setSupervisorInput] = useState("");
  // eq / med filters
  const [filterEqStatus, setFilterEqStatus] = useState("all");
  const [filterExpiry,   setFilterExpiry]   = useState("all");
  const [eqSearch,  setEqSearch]  = useState("");
  const [medSearch, setMedSearch] = useState("");
  // med/eq modals
  const [showMedModal, setShowMedModal] = useState(false);
  const [editMed,   setEditMed]   = useState(null);
  const [medForm,   setMedForm]   = useState({name:"",stdQty:"",qty:"",unit:"",expiry:""});
  const [showEqModal, setShowEqModal] = useState(false);
  const [eqForm,    setEqForm]    = useState({name:"",stdQty:"",unit:"",note:""});
  // report selectors
  const [reportAmbId,   setReportAmbId]   = useState("AM-001");
  const [reportYear,    setReportYear]    = useState(TODAY.getFullYear());
  const [reportMonth,   setReportMonth]   = useState(TODAY.getMonth()+1);

  // ─── Google Sheets API URL ─────────────────────────────────────
  const GS_URL = "https://script.google.com/macros/s/AKfycbyfi9hOqJval80e4DXPyw1skZf8WzD43k6ghKpQicDkrqMvhTwm5-DEfnl5dQgh0uj9/exec";

  const isFirstLoad = useRef(true);
  const isSaving = useRef(false);

  // ─── โหลดข้อมูลจาก Google Sheets ─────────────────────────────
  async function loadData(showLoading = false) {
    if (showLoading) setStorageReady(false);
    try {
      const res = await fetch(GS_URL + "?t=" + Date.now());
      const json = await res.json();
      if (json.ok && Array.isArray(json.data) && json.data.length > 0) {
        setAmbulances(prev => {
          return AMBULANCES_INIT.map(init => {
            const server = json.data.find(s => s.id === init.id);
            const local  = prev.find(p => p.id === init.id);
            if (!server) return local || init;
            // เอา logs ที่มากกว่ามาใช้ (ป้องกัน log หาย)
            const serverLogs = server.inspectionLogs || [];
            const localLogs  = local?.inspectionLogs || [];
            const allLogs = [...serverLogs];
            // เพิ่ม local logs ที่ไม่มีใน server
            localLogs.forEach(ll => {
              if (!allLogs.find(sl => sl.id === ll.id)) {
                allLogs.push(ll);
              }
            });
            // เรียงตามวันที่
            allLogs.sort((a,b) => a.date.localeCompare(b.date));
            return {
              ...init,
              ...server,
              equipment:      server.equipment      || local?.equipment      || init.equipment,
              medications:    server.medications    || local?.medications    || init.medications,
              inspectionLogs: allLogs,
              monthlyAcks:    { ...(local?.monthlyAcks||{}), ...(server.monthlyAcks||{}) },
              status:         server.status         || local?.status         || init.status,
              notes:          server.notes !== undefined ? server.notes : (local?.notes ?? init.notes),
            };
          });
        });
      }
    } catch(e) {
      console.log("โหลดข้อมูลไม่ได้");
    } finally {
      setStorageReady(true);
      isFirstLoad.current = false;
    }
  }

  // โหลดตอนเปิดแอป
  useEffect(() => { loadData(true); }, []); // eslint-disable-line

  // Auto-refresh ทุก 15 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSaving.current) loadData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line
  
  // โหลดใหม่เมื่อ tab กลับมา focus (เปิดแอปจาก background)
  useEffect(() => {
    function onFocus() { loadData(false); }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadData(false);
    });
    return () => window.removeEventListener("focus", onFocus);
  }, []); // eslint-disable-line

  // ─── บันทึกไปยัง Google Sheets ────────────────────────────────
  async function saveToSheets(data) {
    isSaving.current = true;
    setSaveStatus("saving");
    try {
      await fetch(GS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ data }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2500);
    } catch(e) {
      setSaveStatus("error");
    } finally {
      isSaving.current = false;
    }
  }

  // บันทึกอัตโนมัติเมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (!storageReady) return;
    if (isFirstLoad.current) return;
    saveToSheets(ambulances);
  }, [ambulances, storageReady]); // eslint-disable-line

  // ─── แสดงหน้าโหลดขณะดึงข้อมูล ───────────────────────────────
  const amb = ambulances.find(a=>a.id===selectedId);

  const summary = useMemo(()=>ambulances.map(a=>{
    const expiredMeds = a.medications.filter(m=>expiryStatus(m.expiry)==="expired").length;
    const warningMeds = a.medications.filter(m=>expiryStatus(m.expiry)==="warning").length;
    const damagedEq   = a.equipment.filter(e=>e.eq_status==="damaged").length;
    const completeEq  = a.equipment.filter(e=>e.eq_status==="complete").length;
    const totalEq     = a.equipment.length;
    const pct = totalEq ? Math.round(completeEq/totalEq*100) : 0;
    const hasIssue = damagedEq>0 || expiredMeds>0;
    const inspectedToday = a.inspectionLogs.some(l=>l.date===TODAY_STR);
    return {...a, expiredMeds,warningMeds,damagedEq,completeEq,totalEq,pct,hasIssue,inspectedToday};
  }),[ambulances]);

  // ── Derived filtered lists (hooks ต้องอยู่ก่อน early return ทั้งหมด) ──
  const filteredEq = useMemo(()=>{
    let list=amb?.equipment||[];
    if(filterEqStatus!=="all") list=list.filter(e=>e.eq_status===filterEqStatus);
    if(eqSearch) list=list.filter(e=>e.name.includes(eqSearch));
    return list;
  },[amb,filterEqStatus,eqSearch]);

  const filteredMeds = useMemo(()=>{
    let list=amb?.medications||[];
    if(filterExpiry!=="all") list=list.filter(m=>expiryStatus(m.expiry)===filterExpiry);
    if(medSearch) list=list.filter(m=>m.name.includes(medSearch));
    return list;
  },[amb,filterExpiry,medSearch]);

  const reportAmb  = ambulances.find(a=>a.id===reportAmbId)||ambulances[0];
  const reportLogs = useMemo(()=>getMonthLogs(reportAmb.inspectionLogs,reportYear,reportMonth),[reportAmb,reportYear,reportMonth]);

  // ── Early return: loading screen (ต้องอยู่หลัง hooks ทั้งหมด) ──
  if (!storageReady) {
    return (
      <div style={{minHeight:"100vh",background:"#EEF2F7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sarabun','Noto Sans Thai',sans-serif"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>🚑</div>
          <div style={{fontSize:18,fontWeight:700,color:"#1B3A6B",marginBottom:8}}>กำลังโหลดข้อมูล...</div>
          <div style={{fontSize:13,color:"#6B7280"}}>กรุณารอสักครู่</div>
        </div>
      </div>
    );
  }

  function upd(id,fn){ setAmbulances(p=>p.map(a=>a.id===id?fn(a):a)); }
  function toggleEq(eqId){ upd(selectedId,a=>({...a,equipment:a.equipment.map(e=>e.id===eqId?{...e,eq_status:e.eq_status==="complete"?"damaged":"complete"}:e)})); }
  function updateEqNote(eqId,note){ upd(selectedId,a=>({...a,equipment:a.equipment.map(e=>e.id===eqId?{...e,note}:e)})); }

  // ─── Submit daily log ─────────────────────────────────────────
  function submitDailyLog() {
    if(!dailyForm.inspector.trim()){alert("กรุณาระบุชื่อผู้ตรวจสอบ");return;}
    if(!dailyForm.mileage.trim()){alert("กรุณาระบุเลขไมล์");return;}
    const log = {
      id:"log_"+Date.now(), date:TODAY_STR,
      inspector:dailyForm.inspector,
      mileage:dailyForm.mileage, fuel:dailyForm.fuel,
      ambStatus:amb.status, notes:dailyForm.notes,
      damagedCount: amb.equipment.filter(e=>e.eq_status==="damaged").length,
      expiredCount:  amb.medications.filter(m=>expiryStatus(m.expiry)==="expired").length,
      eqSnapshot:  snapshotEq(amb.equipment),
      medSnapshot: snapshotMed(amb.medications),
      crewAck:false, crewAckBy:"", crewAckTime:"",
    };
    upd(selectedId,a=>({...a,inspectionLogs:[...a.inspectionLogs,log]}));
    // ส่ง log row ไปบันทึกใน Google Sheets แยกแถว
    fetch(GS_URL, {
      method:"POST",
      headers:{"Content-Type":"text/plain"},
      body: JSON.stringify({
        data: ambulances,
        log: {
          date: log.date, ambId: amb.id,
          licensePlate: amb.licensePlate, crew: amb.crew,
          inspector: log.inspector, mileage: log.mileage,
          fuel: log.fuel, ambStatus: log.ambStatus,
          damagedCount: log.damagedCount, expiredCount: log.expiredCount,
          crewAck: false, crewAckBy: "", notes: log.notes,
        }
      })
    }).catch(()=>{});
    setDailyForm({inspector:"",mileage:"",fuel:"เต็ม (F)",notes:""});
    alert("✅ บันทึกการตรวจสอบประจำวันเรียบร้อยแล้ว");
    // โหลดข้อมูลใหม่หลังบันทึก 3 วินาที เพื่อให้แน่ใจว่า sync แล้ว
    setTimeout(() => loadData(false), 3000);
  }

  // ─── ผู้รับผิดชอบรถ รับทราบรายวัน ───────────────────────────
  function submitCrewAck(logId) {
    if(!crewAckInput.trim()){alert("กรุณาระบุชื่อผู้รับทราบ");return;}
    const log = amb.inspectionLogs.find(l=>l.id===logId);
    upd(selectedId,a=>({
      ...a, inspectionLogs:a.inspectionLogs.map(l=>l.id===logId
        ?{...l,crewAck:true,crewAckBy:crewAckInput,crewAckTime:new Date().toLocaleString("th-TH")}:l)
    }));
    // ส่ง ack ไปอัปเดต Google Sheets
    if(log) {
      fetch(GS_URL, {
        method:"POST",
        headers:{"Content-Type":"text/plain"},
        body: JSON.stringify({
          type:"ack",
          date: log.date,
          ambId: selectedId,
          crewAckBy: crewAckInput,
        })
      }).catch(()=>{});
    }
    setCrewAckModal(null); setCrewAckInput("");
  }

  // ─── ผู้ควบคุมงาน รับทราบรายเดือน ───────────────────────────
  function submitMonthAck({ambId,year,month}) {
    if(!supervisorInput.trim()){alert("กรุณาระบุชื่อผู้ควบคุมงาน");return;}
    const key = monthKey(year,month);
    upd(ambId,a=>({
      ...a, monthlyAcks:{...a.monthlyAcks,[key]:{supervisor:supervisorInput,ackTime:new Date().toLocaleString("th-TH")}}
    }));
    setMonthAckModal(null); setSupervisorInput("");
  }

  // ─── Med / Eq CRUD ────────────────────────────────────────────
  function openAddMed(){ setEditMed(null); setMedForm({name:"",stdQty:"",qty:"",unit:"",expiry:""}); setShowMedModal(true); }
  function openEditMed(med){ setEditMed(med.id); setMedForm({name:med.name,stdQty:med.stdQty||"",qty:med.qty,unit:med.unit,expiry:med.expiry}); setShowMedModal(true); }
  function saveMed(){
    if(!medForm.name.trim())return;
    upd(selectedId,a=>{
      if(editMed) return{...a,medications:a.medications.map(m=>m.id===editMed?{...m,...medForm}:m)};
      const maxNo=Math.max(...a.medications.map(m=>m.no||0),0);
      return{...a,medications:[...a.medications,{id:"m"+Date.now(),no:maxNo+1,...medForm}]};
    });
    setShowMedModal(false);
  }
  function deleteMed(id){ if(!window.confirm("ยืนยันลบ?"))return; upd(selectedId,a=>({...a,medications:a.medications.filter(m=>m.id!==id)})); }
  function saveEq(){
    if(!eqForm.name.trim())return;
    upd(selectedId,a=>{const maxNo=Math.max(...a.equipment.map(e=>e.no||0),0); return{...a,equipment:[...a.equipment,{id:"e"+Date.now(),no:maxNo+1,...eqForm,eq_status:"complete"}]};});
    setShowEqModal(false); setEqForm({name:"",stdQty:"",unit:"",note:""});
  }
  function deleteEq(id){ if(!window.confirm("ยืนยันลบ?"))return; upd(selectedId,a=>({...a,equipment:a.equipment.filter(e=>e.id!==id)})); }

  // report
  const daysInMonth   = new Date(reportYear,reportMonth,0).getDate();
  const inspectedDays = new Set(reportLogs.map(l=>l.date)).size;
  const mk = monthKey(reportYear,reportMonth);
  const monthAck = reportAmb.monthlyAcks?.[mk];

  if(!amb) return null;
  const ambSty  = AMB_STATUS_STYLE[amb.status]||AMB_STATUS_STYLE["ไม่พร้อม"];
  const sel     = summary.find(s=>s.id===selectedId);
  const totalEq = amb.equipment.length;
  const doneEq  = amb.equipment.filter(e=>e.eq_status==="complete").length;
  const badEq   = totalEq-doneEq;
  const pct     = sel?.pct??0;
  const todayLog = amb.inspectionLogs.find(l=>l.date===TODAY_STR);
  const overallReady = badEq===0 && (sel?.expiredMeds||0)===0;

  const T=(key)=>({
    padding:"9px 18px", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer",
    border:activeTab===key?"none":"2px solid #E5E7EB",
    background:activeTab===key?"#1B3A6B":"#fff",
    color:activeTab===key?"#fff":"#4B5563", transition:"all .15s",
  });

  return (
    <div style={{minHeight:"100vh",background:"#EEF2F7",fontFamily:"'Sarabun','Noto Sans Thai',sans-serif",fontSize:14}}>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div style={{background:"linear-gradient(135deg,#1B3A6B 0%,#0D2240 100%)",padding:"14px 20px",boxShadow:"0 4px 20px rgba(13,34,64,.45)"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <span style={{fontSize:28}}>🚑</span>
            <div style={{flex:1}}>
              <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>ระบบตรวจสอบความพร้อมรถพยาบาล ALS</div>
              <div style={{fontSize:12,color:"#93C5FD"}}>{TODAY.toLocaleDateString("th-TH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
            <div style={{display:"flex",gap:8,fontSize:12,alignItems:"center"}}>
              {saveStatus==="saving" && <span style={{color:"#93C5FD",fontSize:11}}>⏳ กำลังบันทึก...</span>}
              {saveStatus==="saved"  && <span style={{color:"#86EFAC",fontSize:11}}>✅ บันทึกแล้ว</span>}
              {saveStatus==="error"  && <span style={{color:"#FCA5A5",fontSize:11}}>⚠️ บันทึกไม่สำเร็จ</span>}
              <button onClick={()=>loadData(false)} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"4px 10px",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:600}}>🔄 รีเฟรช</button>
              <span style={{background:"rgba(16,185,129,.2)",border:"1px solid #6EE7B7",borderRadius:8,padding:"4px 12px",color:"#6EE7B7",fontWeight:700}}>✓ พร้อม {summary.filter(s=>!s.hasIssue).length} คัน</span>
              <span style={{background:"rgba(239,68,68,.2)",border:"1px solid #FCA5A5",borderRadius:8,padding:"4px 12px",color:"#FCA5A5",fontWeight:700}}>⚠ มีปัญหา {summary.filter(s=>s.hasIssue).length} คัน</span>
            </div>
          </div>
          {/* Fleet tabs */}
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
            {summary.map(s=>(
              <div key={s.id} onClick={()=>{setSelectedId(s.id);setActiveTab("daily");}} style={{
                flexShrink:0,background:selectedId===s.id?"rgba(255,255,255,.18)":"rgba(255,255,255,.06)",
                border:selectedId===s.id?"2px solid #60A5FA":"2px solid rgba(255,255,255,.12)",
                borderRadius:10,padding:"9px 14px",cursor:"pointer",position:"relative",minWidth:120,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                  <span style={{fontSize:12,fontWeight:800,color:"#fff"}}>{s.id}</span>
                  <span style={{fontSize:9,background:"#1D4ED8",color:"#BFDBFE",borderRadius:4,padding:"1px 5px",fontWeight:700}}>ALS</span>
                </div>
                <div style={{fontSize:11,color:"#93C5FD",marginBottom:2}}>👤 {s.crew}</div>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:AMB_STATUS_STYLE[s.status]?.dot||"#9CA3AF",display:"inline-block"}}></span>
                  <span style={{fontSize:9,color:"#CBD5E1"}}>{s.status}</span>
                  {s.inspectedToday&&<span style={{fontSize:9,color:"#86EFAC",marginLeft:4}}>● ตรวจแล้ว</span>}
                </div>
                <div style={{background:"rgba(255,255,255,.15)",borderRadius:99,height:3,overflow:"hidden"}}>
                  <div style={{background:s.pct===100?"#10B981":s.pct>=80?"#F59E0B":"#EF4444",width:s.pct+"%",height:"100%"}}></div>
                </div>
                {s.hasIssue&&<div style={{position:"absolute",top:-7,right:-7,background:"#EF4444",color:"#fff",borderRadius:"50%",width:17,height:17,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{s.expiredMeds+s.damagedEq}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"16px 14px"}}>

        {/* ══ INFO CARD ══════════════════════════════════════════ */}
        <div style={{background:"#fff",borderRadius:14,padding:"16px 20px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:220}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,flexWrap:"wrap"}}>
                <span style={{fontSize:22,fontWeight:900,color:"#1B3A6B"}}>{amb.id}</span>
                <span style={{background:"#DBEAFE",color:"#1D4ED8",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>ALS</span>
                <span style={{background:ambSty.bg,color:ambSty.text,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>● {amb.status}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"4px 12px",fontSize:13}}>
                <span style={{color:"#6B7280"}}>🚗</span><span style={{fontWeight:600}}>{amb.licensePlate}</span>
                <span style={{color:"#6B7280"}}>👤 ผู้รับผิดชอบ</span><span style={{fontWeight:700,color:"#1B3A6B"}}>{amb.crew}</span>
                {todayLog&&<><span style={{color:"#6B7280"}}>📋 วันนี้</span><span style={{color:"#065F46",fontWeight:600}}>✓ ตรวจโดย {todayLog.inspector} | ⛽ {todayLog.fuel} | 🛣 {todayLog.mileage} กม.</span></>}
              </div>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {/* overall */}
              <div style={{background:overallReady?"#ECFDF5":"#FFF5F5",border:"2px solid "+(overallReady?"#6EE7B7":"#FCA5A5"),borderRadius:12,padding:"10px 14px",textAlign:"center",minWidth:110}}>
                <div style={{fontSize:24}}>{overallReady?"✅":"⚠️"}</div>
                <div style={{fontSize:13,fontWeight:800,color:overallReady?"#065F46":"#B91C1C",marginTop:3}}>{overallReady?"พร้อมใช้งาน":"ต้องตรวจสอบ"}</div>
              </div>
              {/* eq */}
              <div style={{background:"#F8FAFC",borderRadius:12,padding:"10px 14px",minWidth:100}}>
                <div style={{fontSize:10,color:"#6B7280",fontWeight:700,marginBottom:5}}>🔧 อุปกรณ์</div>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:"#10B981"}}>{doneEq}</div><div style={{fontSize:9}}>ครบ</div></div>
                  <div style={{width:1,background:"#E2E8F0"}}></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:badEq>0?"#EF4444":"#CBD5E1"}}>{badEq}</div><div style={{fontSize:9}}>ชำรุด</div></div>
                </div>
                <div style={{background:"#E2E8F0",borderRadius:99,height:4,marginTop:6,overflow:"hidden"}}>
                  <div style={{background:pct===100?"#10B981":pct>=80?"#F59E0B":"#EF4444",width:pct+"%",height:"100%"}}></div>
                </div>
              </div>
              {/* med */}
              <div style={{background:"#F8FAFC",borderRadius:12,padding:"10px 14px",minWidth:100}}>
                <div style={{fontSize:10,color:"#6B7280",fontWeight:700,marginBottom:5}}>💊 เวชภัณฑ์</div>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:(sel?.expiredMeds||0)>0?"#EF4444":"#CBD5E1"}}>{sel?.expiredMeds||0}</div><div style={{fontSize:9}}>หมดอายุ</div></div>
                  <div style={{width:1,background:"#E2E8F0"}}></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:(sel?.warningMeds||0)>0?"#F59E0B":"#CBD5E1"}}>{sel?.warningMeds||0}</div><div style={{fontSize:9}}>ใกล้หมด</div></div>
                </div>
              </div>
              {/* status control */}
              <div style={{background:"#F8FAFC",borderRadius:12,padding:"10px 14px"}}>
                <div style={{fontSize:10,color:"#6B7280",fontWeight:700,marginBottom:5}}>สถานะรถ</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {AMB_STATUS_OPTIONS.map(opt=>(
                    <button key={opt} onClick={()=>upd(selectedId,a=>({...a,status:opt}))} style={{
                      padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",
                      border:amb.status===opt?"2px solid "+AMB_STATUS_STYLE[opt].dot:"2px solid #E5E7EB",
                      background:amb.status===opt?AMB_STATUS_STYLE[opt].bg:"#fff",
                      color:amb.status===opt?AMB_STATUS_STYLE[opt].text:"#9CA3AF",
                    }}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ TABS ════════════════════════════════════════════════ */}
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          <button style={T("daily")}    onClick={()=>setActiveTab("daily")}>📝 บันทึกประจำวัน</button>
          <button style={T("equipment")} onClick={()=>setActiveTab("equipment")}>🔧 รายการอุปกรณ์</button>
          <button style={T("medications")} onClick={()=>setActiveTab("medications")}>💊 เวชภัณฑ์</button>
          <button style={T("report")}   onClick={()=>setActiveTab("report")}>📊 รายงานรายเดือน</button>
        </div>

        {/* ══ DAILY TAB ═══════════════════════════════════════════ */}
        {activeTab==="daily"&&(
          <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-start"}}>

            {/* ── บันทึกฟอร์ม ────────────────────────────────────── */}
            <div style={{flex:"1 1 340px",background:"#fff",borderRadius:14,padding:"20px 22px",boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#1B3A6B",marginBottom:4}}>📝 บันทึกตรวจสอบประจำวัน</div>
              <div style={{fontSize:12,color:"#6B7280",marginBottom:14}}>
                วันที่ {TODAY_STR} &nbsp;|&nbsp; ผู้รับผิดชอบรถ: <strong style={{color:"#1B3A6B"}}>{amb.crew}</strong>
              </div>

              {todayLog&&(
                <div style={{background:"#ECFDF5",border:"2px solid #6EE7B7",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#065F46",fontWeight:600}}>
                  ✅ บันทึกแล้วในวันนี้ โดย {todayLog.inspector} &nbsp;|&nbsp; ⛽ {todayLog.fuel} &nbsp;|&nbsp; 🛣 {todayLog.mileage} กม.
                </div>
              )}

              {/* Inspector + Mileage */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>👤 ผู้ตรวจสอบ *</label>
                  <input value={dailyForm.inspector} onChange={e=>setDailyForm(p=>({...p,inspector:e.target.value}))}
                    placeholder="ชื่อผู้ตรวจ (ใครก็ได้)"
                    style={{width:"100%",padding:"8px 11px",borderRadius:8,border:"1.5px solid #D1D5DB",fontSize:13,boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>🛣 เลขไมล์ (กม.) *</label>
                  <input type="number" value={dailyForm.mileage} onChange={e=>setDailyForm(p=>({...p,mileage:e.target.value}))}
                    placeholder="เช่น 123456"
                    style={{width:"100%",padding:"8px 11px",borderRadius:8,border:"1.5px solid #D1D5DB",fontSize:13,boxSizing:"border-box"}}/>
                </div>
              </div>

              {/* Fuel */}
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>⛽ ปริมาณน้ำมัน</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {FUEL_LEVELS.map(f=>(
                    <button key={f} onClick={()=>setDailyForm(p=>({...p,fuel:f}))} style={{
                      padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",
                      background:dailyForm.fuel===f?FUEL_COLOR[f]:"#F1F5F9",
                      color:dailyForm.fuel===f?"#fff":"#475569",
                      border:dailyForm.fuel===f?"2px solid "+FUEL_COLOR[f]:"2px solid #E2E8F0",
                    }}>{f}</button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>📌 หมายเหตุ / ปัญหาที่พบ</label>
                <textarea value={dailyForm.notes} onChange={e=>setDailyForm(p=>({...p,notes:e.target.value}))}
                  placeholder="ระบุปัญหาหรือข้อสังเกต..."
                  style={{width:"100%",padding:"8px 11px",borderRadius:8,border:"1.5px solid #D1D5DB",fontSize:13,boxSizing:"border-box",height:60,resize:"none"}}/>
              </div>

              {/* Snapshot summary */}
              <div style={{background:"#F8FAFC",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#475569",marginBottom:12}}>
                <div style={{fontWeight:700,marginBottom:5}}>📊 สรุปสถานะ ณ เวลาบันทึก</div>
                <div style={{display:"flex",gap:16}}>
                  <span>🔧 ชำรุด: <strong style={{color:badEq>0?"#EF4444":"#10B981"}}>{badEq} รายการ</strong></span>
                  <span>💊 หมดอายุ: <strong style={{color:(sel?.expiredMeds||0)>0?"#EF4444":"#10B981"}}>{sel?.expiredMeds||0} รายการ</strong></span>
                  <span>🚑 <strong style={{color:ambSty.text}}>{amb.status}</strong></span>
                </div>
              </div>

              <button onClick={submitDailyLog} style={{width:"100%",padding:"11px",borderRadius:10,background:"#1B3A6B",color:"#fff",border:"none",fontSize:14,fontWeight:800,cursor:"pointer"}}>
                💾 บันทึกการตรวจสอบวันนี้
              </button>
            </div>

            {/* ── ประวัติ ─────────────────────────────────────────── */}
            <div style={{flex:"1 1 340px",background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,.07)",maxHeight:580,overflowY:"auto"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#1B3A6B",marginBottom:14}}>
                📋 ประวัติการตรวจสอบ ({amb.inspectionLogs.length} ครั้ง)
              </div>
              {[...amb.inspectionLogs].reverse().map(log=>(
                <div key={log.id} style={{borderRadius:10,border:"1.5px solid #E2E8F0",padding:"12px 14px",marginBottom:10,background:log.crewAck?"#F0FDF4":"#FAFAFA"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:"#1B3A6B",fontSize:13}}>📅 {log.date}</div>
                      <div style={{fontSize:12,color:"#374151",marginTop:2}}>
                        👤 ผู้ตรวจ: <strong>{log.inspector||"-"}</strong>
                      </div>
                      <div style={{fontSize:12,color:"#374151"}}>
                        🛣 {log.mileage} กม. &nbsp;⛽ <span style={{color:FUEL_COLOR[log.fuel]||"#374151",fontWeight:700}}>{log.fuel}</span>
                      </div>
                      <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                        {log.damagedCount>0&&<span style={{fontSize:10,background:"#FEE2E2",color:"#B91C1C",borderRadius:5,padding:"2px 7px",fontWeight:700}}>✗ ชำรุด {log.damagedCount}</span>}
                        {log.expiredCount>0&&<span style={{fontSize:10,background:"#FEE2E2",color:"#B91C1C",borderRadius:5,padding:"2px 7px",fontWeight:700}}>💊 หมดอายุ {log.expiredCount}</span>}
                        {log.damagedCount===0&&log.expiredCount===0&&<span style={{fontSize:10,background:"#ECFDF5",color:"#065F46",borderRadius:5,padding:"2px 7px",fontWeight:700}}>✓ ปกติ</span>}
                      </div>
                      {log.notes&&<div style={{fontSize:11,color:"#6B7280",marginTop:4}}>📌 {log.notes}</div>}
                    </div>

                    {/* ผู้รับผิดชอบรถ รับทราบ */}
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {log.crewAck
                        ? <div style={{fontSize:10,color:"#065F46",fontWeight:700,lineHeight:1.7}}>
                            ✅ ผู้รับผิดชอบรับทราบ<br/>
                            <span style={{color:"#1B3A6B"}}>{log.crewAckBy}</span><br/>
                            <span style={{color:"#6B7280",fontWeight:400}}>{log.crewAckTime}</span>
                          </div>
                        : crewAckModal?.logId===log.id
                          ? <div>
                              <div style={{fontSize:10,color:"#92400E",fontWeight:700,marginBottom:4}}>
                                ✍️ ผู้รับผิดชอบลงชื่อ:
                              </div>
                              <input value={crewAckInput} onChange={e=>setCrewAckInput(e.target.value)}
                                placeholder={amb.crew}
                                style={{fontSize:12,padding:"5px 8px",borderRadius:6,border:"1.5px solid #D1D5DB",marginBottom:5,width:140,display:"block",boxSizing:"border-box"}}/>
                              <div style={{display:"flex",gap:4}}>
                                <button onClick={()=>submitCrewAck(log.id)} style={{flex:1,fontSize:11,background:"#1B3A6B",color:"#fff",border:"none",borderRadius:6,padding:"5px 8px",cursor:"pointer",fontWeight:700}}>✅ รับทราบ</button>
                                <button onClick={()=>setCrewAckModal(null)} style={{fontSize:11,background:"#F1F5F9",color:"#475569",border:"none",borderRadius:6,padding:"5px 8px",cursor:"pointer"}}>ยกเลิก</button>
                              </div>
                            </div>
                          : <button onClick={()=>{setCrewAckModal({logId:log.id});setCrewAckInput(amb.crew);}} style={{
                              fontSize:11,background:"#FEF3C7",color:"#92400E",border:"1.5px solid #FCD34D",
                              borderRadius:7,padding:"6px 10px",cursor:"pointer",fontWeight:700,textAlign:"center",lineHeight:1.6
                            }}>✍️ {amb.crew}<br/><span style={{fontSize:10}}>ลงชื่อรับทราบ</span></button>
                      }
                    </div>
                  </div>
                </div>
              ))}
              {amb.inspectionLogs.length===0&&<div style={{textAlign:"center",color:"#9CA3AF",padding:40}}>ยังไม่มีประวัติการตรวจสอบ</div>}
            </div>
          </div>
        )}

        {/* ══ EQUIPMENT TAB ═══════════════════════════════════════ */}
        {activeTab==="equipment"&&(
          <div style={{background:"#fff",borderRadius:14,boxShadow:"0 2px 12px rgba(0,0,0,.07)",overflow:"hidden"}}>
            <div style={{padding:"13px 20px",borderBottom:"1.5px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:15,fontWeight:800,color:"#1B3A6B"}}>รายการตรวจสอบอุปกรณ์</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
                <input placeholder="🔍 ค้นหา..." value={eqSearch} onChange={e=>setEqSearch(e.target.value)} style={{padding:"6px 11px",borderRadius:7,border:"1.5px solid #D1D5DB",fontSize:13,width:150}}/>
                {[{key:"all",label:"ทั้งหมด"},{key:"complete",label:"✓ ครบ"},{key:"damaged",label:"✗ ชำรุด"}].map(f=>(
                  <button key={f.key} onClick={()=>setFilterEqStatus(f.key)} style={{padding:"6px 11px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:filterEqStatus===f.key?"#1B3A6B":"#F1F5F9",color:filterEqStatus===f.key?"#fff":"#475569"}}>{f.label}</button>
                ))}
                <button onClick={()=>setShowEqModal(true)} style={{background:"#1B3A6B",color:"#fff",border:"none",borderRadius:8,padding:"6px 13px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ เพิ่ม</button>
              </div>
            </div>
            <div style={{overflowX:"auto"}}>
              <div style={{minWidth:640}}>
              <div style={{display:"grid",gridTemplateColumns:"40px 1fr 100px 110px 1fr 36px",gap:"0 8px",background:"#F8FAFC",padding:"7px 20px",fontSize:11,fontWeight:700,color:"#64748B",borderBottom:"1.5px solid #E2E8F0"}}>
                <span>#</span><span>รายการ</span><span style={{textAlign:"center"}}>จำนวน/มาตรฐาน</span><span style={{textAlign:"center"}}>สถานะ</span><span>หมายเหตุ</span><span></span>
              </div>
              <div>
                {filteredEq.map((eq,idx)=>{
                  const ok=eq.eq_status==="complete"; const s=EQ_BTN[eq.eq_status];
                  return (
                    <div key={eq.id} style={{display:"grid",gridTemplateColumns:"40px 1fr 100px 110px 1fr 36px",gap:"0 8px",alignItems:"center",padding:"9px 20px",background:ok?(idx%2===0?"#fff":"#FAFAFA"):"#FFF5F5",borderBottom:"1px solid #F1F5F9"}}>
                      <span style={{fontSize:11,color:"#94A3B8",fontWeight:600}}>{eq.no}</span>
                      <span style={{fontSize:13,fontWeight:600,color:ok?"#1E293B":"#B91C1C",whiteSpace:"nowrap"}}>{eq.name}</span>
                      <div style={{textAlign:"center"}}><span style={{fontSize:12,color:"#64748B"}}>{eq.stdQty}</span><span style={{fontSize:10,color:"#94A3B8"}}> {eq.unit}</span></div>
                      <div style={{display:"flex",justifyContent:"center"}}>
                        <button onClick={()=>toggleEq(eq.id)} style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:800,cursor:"pointer",background:s.bg,color:s.text,border:"2px solid "+s.border,minWidth:82,whiteSpace:"nowrap"}}>{s.label}</button>
                      </div>
                      <input value={eq.note} onChange={e=>updateEqNote(eq.id,e.target.value)} placeholder="หมายเหตุ..."
                        style={{padding:"4px 8px",borderRadius:6,border:"1.5px solid "+(ok?"#E2E8F0":"#FCA5A5"),fontSize:12,width:"100%",boxSizing:"border-box",background:ok?"#fff":"#FFF0F0"}}/>
                      <button onClick={()=>deleteEq(eq.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#CBD5E1",fontSize:14}}>🗑</button>
                    </div>
                  );
                })}
                {filteredEq.length===0&&<div style={{textAlign:"center",color:"#9CA3AF",padding:36}}>ไม่พบรายการ</div>}
              </div>
              </div>
            </div>
            <div style={{display:"flex",gap:16,padding:"10px 20px",background:"#F8FAFC",borderTop:"1.5px solid #E2E8F0",fontSize:13,fontWeight:700}}>
              <span style={{color:"#10B981"}}>✓ ครบ {doneEq}</span>
              <span style={{color:badEq>0?"#EF4444":"#94A3B8"}}>✗ ชำรุด {badEq}</span>
              <span style={{color:"#64748B",marginLeft:"auto"}}>ทั้งหมด {totalEq} | {pct}%</span>
            </div>
          </div>
        )}

        {/* ══ MEDICATIONS TAB ═════════════════════════════════════ */}
        {activeTab==="medications"&&(
          <div style={{background:"#fff",borderRadius:14,boxShadow:"0 2px 12px rgba(0,0,0,.07)",overflow:"hidden"}}>
            <div style={{padding:"13px 20px",borderBottom:"1.5px solid #F1F5F9",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:15,fontWeight:800,color:"#1B3A6B"}}>รายการเวชภัณฑ์ (มีวันหมดอายุ)</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
                <input placeholder="🔍 ค้นหา..." value={medSearch} onChange={e=>setMedSearch(e.target.value)} style={{padding:"6px 11px",borderRadius:7,border:"1.5px solid #D1D5DB",fontSize:13,width:140}}/>
                {[{key:"all",label:"ทั้งหมด"},{key:"expired",label:"🔴 หมดอายุ"},{key:"warning",label:"🟡 ใกล้หมด"},{key:"ok",label:"🟢 ปกติ"}].map(f=>(
                  <button key={f.key} onClick={()=>setFilterExpiry(f.key)} style={{padding:"6px 11px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",background:filterExpiry===f.key?"#1B3A6B":"#F1F5F9",color:filterExpiry===f.key?"#fff":"#475569"}}>{f.label}</button>
                ))}
                <button onClick={openAddMed} style={{background:"#1B3A6B",color:"#fff",border:"none",borderRadius:8,padding:"6px 13px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ เพิ่ม</button>
              </div>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:660}}>
                <thead><tr style={{background:"#F8FAFC"}}>
                  {["#","ชื่อเวชภัณฑ์","จำนวน/มาตรฐาน","จำนวนปัจจุบัน","หน่วย","วันหมดอายุ (ค.ศ.)","คงเหลือ","สถานะ",""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"9px 13px",fontSize:11,color:"#64748B",fontWeight:700,borderBottom:"2px solid #E2E8F0",whiteSpace:"nowrap"}}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filteredMeds.map((med,idx)=>{
                    const st=expiryStatus(med.expiry); const sc=EXP_COLORS[st]; const days=daysUntil(med.expiry);
                    return (
                      <tr key={med.id} style={{borderBottom:"1px solid #F1F5F9",background:idx%2===0?"#fff":"#FAFAFA"}}>
                        <td style={{padding:"9px 13px",fontSize:11,color:"#94A3B8",fontWeight:600}}>{med.no}</td>
                        <td style={{padding:"9px 13px",fontSize:13,fontWeight:600,color:"#1E293B"}}>{med.name}</td>
                        <td style={{padding:"9px 13px",fontSize:12,color:"#64748B",textAlign:"center"}}>{med.stdQty}</td>
                        <td style={{padding:"9px 13px",fontSize:13,fontWeight:700,textAlign:"center"}}>{med.qty}</td>
                        <td style={{padding:"9px 13px",fontSize:12,color:"#64748B"}}>{med.unit}</td>
                        <td style={{padding:"9px 13px",background:sc.bg}}>
                          <div style={{fontWeight:700,color:sc.text,fontSize:12}}>{formatExpiry(med.expiry)}</div>
                          <div style={{fontSize:10,color:sc.text,opacity:.7}}>{med.expiry||""}</div>
                        </td>
                        <td style={{padding:"9px 13px",background:sc.bg}}>
                          {days!==null?<div style={{fontSize:11,color:sc.text,fontWeight:700}}>{days<0?`เกิน ${Math.abs(days)} วัน`:days===0?"วันนี้!":`อีก ${days} วัน`}</div>:<span style={{color:"#CBD5E1"}}>-</span>}
                        </td>
                        <td style={{padding:"9px 13px"}}><Pill bg={sc.badge} text="#fff" label={sc.label}/></td>
                        <td style={{padding:"9px 13px"}}>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={()=>openEditMed(med)} style={{background:"#EFF6FF",color:"#1D4ED8",border:"none",borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer",fontWeight:700}}>แก้ไข</button>
                            <button onClick={()=>deleteMed(med.id)} style={{background:"#FEE2E2",color:"#B91C1C",border:"none",borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer",fontWeight:700}}>ลบ</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMeds.length===0&&<tr><td colSpan={9} style={{textAlign:"center",color:"#9CA3AF",padding:36}}>ไม่พบรายการ</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ REPORT TAB ══════════════════════════════════════════ */}
        {activeTab==="report"&&(
          <div>
            {/* Selectors */}
            <div style={{background:"#fff",borderRadius:14,padding:"16px 20px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.07)",display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#1B3A6B"}}>📊 รายงานสรุปรายเดือน</div>
              <select value={reportAmbId} onChange={e=>setReportAmbId(e.target.value)}
                style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #D1D5DB",fontSize:13,fontWeight:600}}>
                {ambulances.map(a=><option key={a.id} value={a.id}>{a.id} — {a.crew}</option>)}
              </select>
              <select value={reportMonth} onChange={e=>setReportMonth(Number(e.target.value))}
                style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #D1D5DB",fontSize:13}}>
                {MONTHS_TH.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select value={reportYear} onChange={e=>setReportYear(Number(e.target.value))}
                style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid #D1D5DB",fontSize:13}}>
                {[2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
              </select>

              {/* ── ผู้ควบคุมงาน รับทราบรายเดือน ── */}
              <div style={{marginLeft:"auto"}}>
                {monthAck
                  ? <div style={{background:"#ECFDF5",border:"1.5px solid #6EE7B7",borderRadius:10,padding:"8px 14px",fontSize:12,color:"#065F46",fontWeight:700,textAlign:"center"}}>
                      ✅ ผู้ควบคุมงานรับทราบแล้ว<br/>
                      <span style={{color:"#1B3A6B"}}>{monthAck.supervisor}</span>
                      <span style={{color:"#6B7280",fontWeight:400,fontSize:11}}> · {monthAck.ackTime}</span>
                    </div>
                  : monthAckModal
                    ? <div style={{background:"#FEF3C7",border:"1.5px solid #FCD34D",borderRadius:10,padding:"10px 14px"}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:6}}>🏅 ผู้ควบคุมงาน รับทราบรายงานเดือน {MONTHS_TH[reportMonth-1]} {reportYear}</div>
                        <input value={supervisorInput} onChange={e=>setSupervisorInput(e.target.value)}
                          placeholder="ชื่อผู้ควบคุมงาน"
                          style={{padding:"7px 10px",borderRadius:7,border:"1.5px solid #D1D5DB",fontSize:13,width:"100%",boxSizing:"border-box",marginBottom:8}}/>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>submitMonthAck({ambId:reportAmbId,year:reportYear,month:reportMonth})}
                            style={{flex:1,padding:"7px",borderRadius:7,background:"#1B3A6B",color:"#fff",border:"none",fontWeight:700,cursor:"pointer",fontSize:12}}>✅ ยืนยันรับทราบ</button>
                          <button onClick={()=>setMonthAckModal(null)}
                            style={{padding:"7px 12px",borderRadius:7,background:"#F1F5F9",color:"#475569",border:"none",fontWeight:700,cursor:"pointer",fontSize:12}}>ยกเลิก</button>
                        </div>
                      </div>
                    : <button onClick={()=>setMonthAckModal(true)} style={{
                        padding:"9px 18px",borderRadius:10,background:"#FEF3C7",color:"#92400E",
                        border:"1.5px solid #FCD34D",fontWeight:700,fontSize:13,cursor:"pointer"
                      }}>🏅 ผู้ควบคุมงาน รับทราบรายเดือน</button>
                }
              </div>
            </div>

            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:14}}>
              {[
                {label:"วันที่ตรวจ",  value:inspectedDays, unit:`/ ${daysInMonth} วัน`, color:"#10B981", icon:"📅"},
                {label:"วันที่ขาด",   value:daysInMonth-inspectedDays, unit:"วัน", color:(daysInMonth-inspectedDays)>0?"#EF4444":"#10B981", icon:"❌"},
                {label:"บันทึกทั้งหมด", value:reportLogs.length, unit:"ครั้ง", color:"#3B82F6", icon:"📋"},
                {label:"ผู้รับผิดชอบรับทราบ", value:reportLogs.filter(l=>l.crewAck).length, unit:`/ ${reportLogs.length} ครั้ง`, color:reportLogs.length>0&&reportLogs.every(l=>l.crewAck)?"#10B981":"#F59E0B", icon:"✍️"},
                {label:"พบอุปกรณ์ชำรุด", value:reportLogs.filter(l=>l.damagedCount>0).length, unit:"ครั้ง", color:reportLogs.filter(l=>l.damagedCount>0).length>0?"#EF4444":"#10B981", icon:"🔧"},
                {label:"พบเวชภัณฑ์หมดอายุ", value:reportLogs.filter(l=>l.expiredCount>0).length, unit:"ครั้ง", color:reportLogs.filter(l=>l.expiredCount>0).length>0?"#EF4444":"#10B981", icon:"💊"},
              ].map(c=>(
                <div key={c.label} style={{background:"#fff",borderRadius:12,padding:"14px",boxShadow:"0 2px 8px rgba(0,0,0,.06)",textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{c.icon}</div>
                  <div style={{fontSize:24,fontWeight:800,color:c.color}}>{c.value}</div>
                  <div style={{fontSize:10,color:"#6B7280"}}>{c.unit}</div>
                  <div style={{fontSize:11,fontWeight:600,color:"#374151",marginTop:2}}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Calendar */}
            <div style={{background:"#fff",borderRadius:14,padding:"16px 20px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1B3A6B",marginBottom:12}}>
                ปฏิทิน {MONTHS_TH[reportMonth-1]} {reportYear} — {reportAmb.id} ({reportAmb.crew})
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
                {["อา","จ","อ","พ","พฤ","ศ","ส"].map(d=>(
                  <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#94A3B8",padding:"3px 0"}}>{d}</div>
                ))}
                {Array.from({length:new Date(reportYear,reportMonth-1,1).getDay()}).map((_,i)=><div key={"b"+i}></div>)}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day=i+1;
                  const ds=`${reportYear}-${String(reportMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const log=reportLogs.find(l=>l.date===ds);
                  const isToday=ds===TODAY_STR;
                  const prob=log&&(log.damagedCount>0||log.expiredCount>0);
                  return (
                    <div key={day} style={{borderRadius:8,padding:"6px 4px",textAlign:"center",fontSize:12,
                      background:log?(prob?"#FEE2E2":log.crewAck?"#ECFDF5":"#EFF6FF"):"#F8FAFC",
                      border:"1.5px solid "+(isToday?"#3B82F6":log?(prob?"#FCA5A5":log.crewAck?"#6EE7B7":"#BFDBFE"):"#E2E8F0"),
                      color:log?(prob?"#B91C1C":log.crewAck?"#065F46":"#1D4ED8"):"#94A3B8"}}>
                      <div style={{fontWeight:700}}>{day}</div>
                      {log&&<div style={{fontSize:9,marginTop:1}}>{log.crewAck?"✅":"📋"}</div>}
                      {log&&<div style={{fontSize:9,color:FUEL_COLOR[log.fuel]}}>⛽</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap",fontSize:11,color:"#6B7280"}}>
                {[["#EFF6FF","#BFDBFE","📋 บันทึกแล้ว"],["#ECFDF5","#6EE7B7","✅ รับทราบแล้ว"],["#FEE2E2","#FCA5A5","⚠️ พบปัญหา"],["#F8FAFC","#E2E8F0","ยังไม่ตรวจ"]].map(([bg,bd,lb])=>(
                  <div key={lb} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:12,height:12,borderRadius:3,background:bg,border:"1.5px solid "+bd}}></div><span>{lb}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Log table */}
            <div style={{background:"#fff",borderRadius:14,padding:"16px 20px",boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700,color:"#1B3A6B"}}>รายการบันทึกทั้งหมด ({reportLogs.length} รายการ)</div>
                {monthAck&&<div style={{fontSize:12,color:"#065F46",fontWeight:600,background:"#ECFDF5",borderRadius:8,padding:"4px 12px"}}>✅ รับทราบโดย: {monthAck.supervisor}</div>}
              </div>
              {reportLogs.length===0
                ? <div style={{textAlign:"center",color:"#9CA3AF",padding:40}}>ไม่มีบันทึกในเดือนนี้</div>
                : <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                      <thead><tr style={{background:"#F8FAFC"}}>
                        {["วันที่","ผู้ตรวจสอบ","เลขไมล์","น้ำมัน","สถานะรถ","อุปกรณ์","เวชภัณฑ์","ผู้รับผิดชอบรับทราบ","หมายเหตุ"].map(h=>(
                          <th key={h} style={{textAlign:"left",padding:"9px 12px",fontSize:11,color:"#64748B",fontWeight:700,borderBottom:"2px solid #E2E8F0",whiteSpace:"nowrap"}}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {[...reportLogs].reverse().map((log,idx)=>(
                          <tr key={log.id} style={{borderBottom:"1px solid #F1F5F9",background:idx%2===0?"#fff":"#FAFAFA"}}>
                            <td style={{padding:"9px 12px",fontWeight:700,color:"#1E293B",fontSize:12}}>{log.date}</td>
                            <td style={{padding:"9px 12px",fontSize:12}}>{log.inspector||"-"}</td>
                            <td style={{padding:"9px 12px",fontSize:12,fontWeight:600}}>{log.mileage} กม.</td>
                            <td style={{padding:"9px 12px",fontSize:12,fontWeight:700,color:FUEL_COLOR[log.fuel]}}>{log.fuel}</td>
                            <td style={{padding:"9px 12px"}}><Pill bg={AMB_STATUS_STYLE[log.ambStatus]?.bg||"#F3F4F6"} text={AMB_STATUS_STYLE[log.ambStatus]?.text||"#374151"} label={log.ambStatus}/></td>
                            <td style={{padding:"9px 12px"}}>{log.damagedCount>0?<span style={{color:"#EF4444",fontWeight:700,fontSize:11}}>✗ {log.damagedCount} รายการ</span>:<span style={{color:"#10B981",fontSize:11,fontWeight:700}}>✓ ครบ</span>}</td>
                            <td style={{padding:"9px 12px"}}>{log.expiredCount>0?<span style={{color:"#EF4444",fontWeight:700,fontSize:11}}>⚠ {log.expiredCount} หมดอายุ</span>:<span style={{color:"#10B981",fontSize:11,fontWeight:700}}>✓ ปกติ</span>}</td>
                            <td style={{padding:"9px 12px",fontSize:11}}>{log.crewAck?<span style={{color:"#065F46",fontWeight:700}}>✅ {log.crewAckBy}</span>:<span style={{color:"#92400E"}}>⏳ รอลงชื่อ</span>}</td>
                            <td style={{padding:"9px 12px",fontSize:11,color:"#6B7280"}}>{log.notes||"-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          </div>
        )}
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════ */}
      {showMedModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
          <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#1B3A6B",marginBottom:16}}>{editMed?"✏️ แก้ไขเวชภัณฑ์":"➕ เพิ่มเวชภัณฑ์"}</div>
            {[{label:"ชื่อเวชภัณฑ์ *",key:"name",type:"text"},{label:"จำนวนมาตรฐาน",key:"stdQty",type:"text"},{label:"จำนวนปัจจุบัน",key:"qty",type:"text"},{label:"หน่วย",key:"unit",type:"text"},{label:"วันหมดอายุ *",key:"expiry",type:"date"}].map(f=>(
              <div key={f.key} style={{marginBottom:11}}>
                <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:3}}>{f.label}</label>
                <input type={f.type} value={medForm[f.key]} onChange={e=>setMedForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{width:"100%",padding:"8px 11px",borderRadius:7,border:"1.5px solid #D1D5DB",fontSize:13,boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setShowMedModal(false)} style={{flex:1,padding:"9px",borderRadius:8,border:"1.5px solid #D1D5DB",background:"#fff",fontWeight:700,cursor:"pointer"}}>ยกเลิก</button>
              <button onClick={saveMed} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:"#1B3A6B",color:"#fff",fontWeight:700,cursor:"pointer"}}>💾 บันทึก</button>
            </div>
          </div>
        </div>
      )}
      {showEqModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
          <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#1B3A6B",marginBottom:16}}>➕ เพิ่มรายการอุปกรณ์</div>
            {[{label:"ชื่ออุปกรณ์ *",key:"name",ph:""},{label:"จำนวนมาตรฐาน",key:"stdQty",ph:"เช่น 2,1"},{label:"หน่วย",key:"unit",ph:"เช่น ชิ้น"},{label:"หมายเหตุ",key:"note",ph:""}].map(f=>(
              <div key={f.key} style={{marginBottom:11}}>
                <label style={{fontSize:12,fontWeight:700,display:"block",marginBottom:3}}>{f.label}</label>
                <input value={eqForm[f.key]} placeholder={f.ph} onChange={e=>setEqForm(p=>({...p,[f.key]:e.target.value}))}
                  style={{width:"100%",padding:"8px 11px",borderRadius:7,border:"1.5px solid #D1D5DB",fontSize:13,boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setShowEqModal(false)} style={{flex:1,padding:"9px",borderRadius:8,border:"1.5px solid #D1D5DB",background:"#fff",fontWeight:700,cursor:"pointer"}}>ยกเลิก</button>
              <button onClick={saveEq} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:"#1B3A6B",color:"#fff",fontWeight:700,cursor:"pointer"}}>💾 บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
