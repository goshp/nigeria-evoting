// ─── shared/styles.js ────────────────────────────────────────────────────────
// Global CSS injected once at the app root via <style> tag.
// All modules import this single source of truth for design tokens and classes.

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green: #006837;
    --green-light: #1a8a4a;
    --green-dark: #004d29;
    --white: #f8f5ef;
    --white2: #edeae2;
    --black: #0e0e0e;
    --gold: #c9a84c;
    --gold-light: #e8c96a;
    --red: #c0392b;
    --gray: #6b6b6b;
    --gray-light: #d4d0c8;
    --shadow: 0 4px 24px rgba(0,0,0,0.12);
    --shadow-lg: 0 12px 48px rgba(0,0,0,0.18);
    --radius: 4px;
    --font-display: 'Playfair Display', serif;
    --font-body: 'IBM Plex Sans', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
  }

  body { font-family: var(--font-body); background: var(--white); color: var(--black); }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* ── NAV ── */
  .nav {
    background: var(--green); color: var(--white);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem; height: 60px;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 12px rgba(0,104,55,0.4);
  }
  .nav-brand { display: flex; align-items: center; gap: 12px; }
  .nav-brand-icon { width: 36px; height: 36px; background: var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .nav-brand-text { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; letter-spacing: 0.02em; }
  .nav-tabs { display: flex; gap: 0; }
  .nav-tab {
    padding: 0 1.4rem; height: 60px; display: flex; align-items: center;
    font-size: 0.82rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s;
    color: rgba(248,245,239,0.75);
  }
  .nav-tab:hover { color: var(--white); background: rgba(255,255,255,0.08); }
  .nav-tab.active { color: var(--gold-light); border-bottom-color: var(--gold-light); }
  .nav-user { font-size: 0.8rem; opacity: 0.8; font-family: var(--font-mono); }

  /* ── HERO BANNER ── */
  .hero {
    background: linear-gradient(135deg, var(--green-dark) 0%, var(--green) 60%, var(--green-light) 100%);
    color: var(--white); padding: 3rem 2rem; position: relative; overflow: hidden;
  }
  .hero::before {
    content: ''; position: absolute; inset: 0;
    background: repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 80px);
  }
  .hero-inner { max-width: 900px; position: relative; }
  .hero-eyebrow { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 0.5rem; }
  .hero-title { font-family: var(--font-display); font-size: 2.4rem; font-weight: 900; line-height: 1.15; margin-bottom: 0.5rem; }
  .hero-sub { font-size: 0.9rem; opacity: 0.8; max-width: 500px; }

  /* ── LAYOUT ── */
  .page { max-width: 1100px; margin: 0 auto; padding: 2rem; flex: 1; }
  .section-title {
    font-family: var(--font-display); font-size: 1.5rem; font-weight: 700;
    color: var(--green-dark); margin-bottom: 1.5rem;
    display: flex; align-items: center; gap: 10px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--gray-light); }

  /* ── CARDS ── */
  .card { background: #fff; border: 1px solid var(--gray-light); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
  .card-header { padding: 1.2rem 1.5rem; border-bottom: 1px solid var(--gray-light); background: #fafaf8; display: flex; align-items: center; justify-content: space-between; }
  .card-header-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
  .card-body { padding: 1.5rem; }

  /* ── FORM ── */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
  .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.2rem; }
  .form-full { grid-column: 1/-1; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--gray); }
  .form-control {
    padding: 0.65rem 0.9rem; border: 1.5px solid var(--gray-light);
    border-radius: var(--radius); font-family: var(--font-body); font-size: 0.9rem;
    background: #fff; outline: none; transition: border-color 0.2s; color: var(--black);
  }
  .form-control:focus { border-color: var(--green); }
  .form-control::placeholder { color: var(--gray-light); }
  select.form-control { cursor: pointer; }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 0.65rem 1.4rem; border-radius: var(--radius); border: none;
    font-family: var(--font-body); font-size: 0.88rem; font-weight: 600;
    cursor: pointer; transition: all 0.18s; letter-spacing: 0.02em;
  }
  .btn-primary { background: var(--green); color: var(--white); }
  .btn-primary:hover { background: var(--green-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,104,55,0.3); }
  .btn-secondary { background: transparent; color: var(--green); border: 1.5px solid var(--green); }
  .btn-secondary:hover { background: var(--green); color: var(--white); }
  .btn-gold { background: var(--gold); color: var(--black); }
  .btn-gold:hover { background: var(--gold-light); transform: translateY(-1px); }
  .btn-danger { background: var(--red); color: #fff; }
  .btn-sm { padding: 0.4rem 0.9rem; font-size: 0.8rem; }
  .btn-lg { padding: 0.85rem 2rem; font-size: 1rem; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }

  /* ── BADGES ── */
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 0.25rem 0.7rem; border-radius: 20px; font-size: 0.73rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
  .badge-active  { background: #d4edda; color: #155724; }
  .badge-pending { background: #fff3cd; color: #856404; }
  .badge-closed  { background: #f8d7da; color: #721c24; }
  .badge-draft   { background: #e2e3e5; color: #383d41; }

  /* ── TABLE ── */
  .table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  .table th { text-align: left; padding: 0.75rem 1rem; background: #f5f3ee; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--gray); border-bottom: 2px solid var(--gray-light); }
  .table td { padding: 0.85rem 1rem; border-bottom: 1px solid #f0ede6; vertical-align: middle; }
  .table tr:last-child td { border-bottom: none; }
  .table tr:hover td { background: #faf9f6; }

  /* ── ELECTION CARD GRID ── */
  .election-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.2rem; margin-bottom: 2rem; }
  .election-card { background: #fff; border: 1px solid var(--gray-light); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .election-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); border-color: var(--green); }
  .election-card-header { padding: 1rem 1.2rem; border-bottom: 1px solid var(--gray-light); display: flex; align-items: flex-start; justify-content: space-between; }
  .election-card-type { font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--green); margin-bottom: 4px; }
  .election-card-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; line-height: 1.3; }
  .election-card-body { padding: 1rem 1.2rem; }
  .election-card-meta { display: flex; gap: 1rem; font-size: 0.78rem; color: var(--gray); margin-bottom: 0.8rem; }
  .election-card-stat { text-align: center; }
  .election-card-stat-val { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--green); }
  .election-card-stat-label { font-size: 0.7rem; color: var(--gray); text-transform: uppercase; letter-spacing: 0.05em; }
  .election-stats { display: flex; gap: 1.5rem; }
  .election-card-actions { padding: 0.8rem 1.2rem; background: #fafaf8; border-top: 1px solid var(--gray-light); display: flex; gap: 0.5rem; }

  /* ── VOTE PORTAL ── */
  .vote-portal { min-height: 100vh; background: var(--white); }
  .vote-hero { background: linear-gradient(135deg, var(--green-dark), var(--green)); color: var(--white); padding: 2.5rem 2rem; text-align: center; }
  .vote-hero h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 900; margin-bottom: 0.3rem; }
  .vote-hero p { opacity: 0.8; font-size: 0.9rem; }
  .vote-seal { width: 64px; height: 64px; background: var(--gold); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 28px; }
  .vote-step { max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
  .vote-progress { display: flex; gap: 0; margin-bottom: 2rem; }
  .vote-progress-step { flex: 1; height: 4px; background: var(--gray-light); transition: background 0.3s; }
  .vote-progress-step.done   { background: var(--green); }
  .vote-progress-step.active { background: var(--gold); }

  /* ── BALLOT ── */
  .ballot { background: #fff; border: 2px solid var(--green); border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-lg); }
  .ballot-header { background: var(--green); color: var(--white); padding: 1.5rem; text-align: center; border-bottom: 4px solid var(--gold); }
  .ballot-header h2 { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; }
  .ballot-header p  { font-size: 0.8rem; opacity: 0.8; margin-top: 4px; }
  .ballot-seal { width: 50px; height: 50px; background: var(--gold); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .ballot-instructions { background: #fffbf0; border-bottom: 1px solid #f0e8c8; padding: 0.8rem 1.5rem; font-size: 0.82rem; color: #6b5a00; display: flex; align-items: center; gap: 8px; }
  .ballot-section { padding: 1.5rem; border-bottom: 1px solid #f0ede6; }
  .ballot-section-title { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--green); margin-bottom: 0.8rem; font-weight: 600; }
  .ballot-question { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--black); }
  .candidate-option { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1rem; border: 1.5px solid var(--gray-light); border-radius: var(--radius); margin-bottom: 0.6rem; cursor: pointer; transition: all 0.15s; }
  .candidate-option:hover    { border-color: var(--green); background: #f0f9f4; }
  .candidate-option.selected { border-color: var(--green); background: #e8f5ee; }
  .candidate-radio { width: 20px; height: 20px; border: 2px solid var(--gray-light); border-radius: 50%; flex-shrink: 0; transition: all 0.15s; position: relative; }
  .candidate-option.selected .candidate-radio { border-color: var(--green); background: var(--green); }
  .candidate-option.selected .candidate-radio::after { content: ''; position: absolute; inset: 4px; background: #fff; border-radius: 50%; }
  .candidate-name   { font-weight: 600; font-size: 0.92rem; }
  .candidate-party  { font-size: 0.78rem; color: var(--gray); font-family: var(--font-mono); }
  .candidate-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--green-dark); display: flex; align-items: center; justify-content: center; color: var(--white); font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
  .ballot-footer { padding: 1.5rem; background: #fafaf8; display: flex; justify-content: space-between; align-items: center; }

  /* ── RECEIPT ── */
  .receipt { border: 2px dashed var(--green); border-radius: 8px; padding: 2rem; text-align: center; background: #fff; max-width: 500px; margin: 0 auto; }
  .receipt-icon  { font-size: 3rem; margin-bottom: 1rem; }
  .receipt-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--green); margin-bottom: 0.5rem; }
  .receipt-code  { font-family: var(--font-mono); font-size: 1rem; background: #f0f9f4; border: 1px solid var(--green); border-radius: var(--radius); padding: 0.8rem 1.2rem; margin: 1rem 0; letter-spacing: 0.1em; color: var(--green-dark); }
  .receipt-note  { font-size: 0.8rem; color: var(--gray); margin-top: 1rem; line-height: 1.6; }

  /* ── RESULTS ── */
  .results-banner { background: #0e0e0e; color: var(--white); padding: 2.5rem 2rem; position: relative; overflow: hidden; }
  .results-banner::before { content: 'RESULTS'; position: absolute; right: -1rem; top: 50%; transform: translateY(-50%); font-family: var(--font-display); font-size: 8rem; font-weight: 900; opacity: 0.05; pointer-events: none; }
  .results-banner h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 900; margin-bottom: 0.25rem; }
  .results-banner p  { color: rgba(255,255,255,0.55); font-size: 0.85rem; }
  .results-live { display: inline-flex; align-items: center; gap: 6px; background: var(--red); color: #fff; padding: 0.2rem 0.7rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
  .results-live::before { content: ''; width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  .result-card { background: #fff; border: 1px solid var(--gray-light); border-radius: var(--radius); overflow: hidden; margin-bottom: 1.5rem; }
  .result-card-header { padding: 1rem 1.5rem; background: var(--green); color: var(--white); display: flex; justify-content: space-between; align-items: center; }
  .result-card-header h3 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
  .result-row { padding: 1rem 1.5rem; border-bottom: 1px solid #f0ede6; display: flex; align-items: center; gap: 1rem; }
  .result-row:last-child { border-bottom: none; }
  .result-rank      { font-family: var(--font-display); font-size: 1.4rem; font-weight: 900; width: 32px; color: var(--gray-light); flex-shrink: 0; }
  .result-rank.first { color: var(--gold); }
  .result-bar-wrap  { flex: 1; }
  .result-bar-label { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85rem; }
  .result-bar       { height: 8px; background: #f0ede6; border-radius: 4px; overflow: hidden; }
  .result-bar-fill  { height: 100%; border-radius: 4px; background: var(--green); transition: width 1s ease; }
  .result-bar-fill.first { background: var(--gold); }
  .result-votes     { font-family: var(--font-mono); font-size: 0.8rem; color: var(--green); font-weight: 600; white-space: nowrap; }

  /* ── STATS BOXES ── */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
  .stat-box { background: #fff; border: 1px solid var(--gray-light); border-radius: var(--radius); padding: 1.2rem 1.5rem; }
  .stat-box-val   { font-family: var(--font-display); font-size: 2rem; font-weight: 900; color: var(--green); }
  .stat-box-label { font-size: 0.75rem; color: var(--gray); text-transform: uppercase; letter-spacing: 0.07em; margin-top: 2px; }

  /* ── AUTH SCREEN ── */
  .auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--green-dark) 0%, var(--green) 100%); padding: 2rem; }
  .auth-card { background: #fff; border-radius: 8px; padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
  .auth-logo { text-align: center; margin-bottom: 2rem; }
  .auth-logo-icon { width: 60px; height: 60px; background: var(--gold); border-radius: 50%; margin: 0 auto 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 26px; }
  .auth-logo h2 { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--green); }
  .auth-logo p  { font-size: 0.8rem; color: var(--gray); }
  .auth-method { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
  .auth-method-btn { flex: 1; padding: 0.7rem; border: 1.5px solid var(--gray-light); border-radius: var(--radius); background: #fff; cursor: pointer; text-align: center; font-size: 0.8rem; font-weight: 600; transition: all 0.15s; }
  .auth-method-btn.active { border-color: var(--green); background: #e8f5ee; color: var(--green); }

  /* ── FINGERPRINT ── */
  .fingerprint-area { width: 100px; height: 100px; margin: 1.5rem auto; border: 3px solid var(--green); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48px; cursor: pointer; transition: all 0.3s; position: relative; }
  .fingerprint-area:hover   { border-color: var(--gold); transform: scale(1.05); }
  .fingerprint-area.scanning { animation: scan 1.5s ease-in-out 3; border-color: var(--gold); }
  @keyframes scan { 0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); } 50% { box-shadow: 0 0 0 20px rgba(201,168,76,0); } }

  /* ── OTP ── */
  .otp-inputs { display: flex; gap: 0.5rem; justify-content: center; margin: 1rem 0; }
  .otp-input { width: 44px; height: 48px; border: 1.5px solid var(--gray-light); border-radius: var(--radius); text-align: center; font-family: var(--font-mono); font-size: 1.2rem; font-weight: 600; outline: none; }
  .otp-input:focus { border-color: var(--green); }

  /* ── ALERTS ── */
  .alert { padding: 0.9rem 1.2rem; border-radius: var(--radius); font-size: 0.85rem; display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; }
  .alert-success { background: #d4edda; color: #155724; border-left: 4px solid var(--green); }
  .alert-warning { background: #fff3cd; color: #856404; border-left: 4px solid var(--gold); }
  .alert-error   { background: #f8d7da; color: #721c24; border-left: 4px solid var(--red); }
  .alert-info    { background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }

  /* ── TABS ── */
  .tabs { display: flex; border-bottom: 2px solid var(--gray-light); margin-bottom: 1.5rem; }
  .tab { padding: 0.6rem 1.2rem; cursor: pointer; font-size: 0.85rem; font-weight: 500; color: var(--gray); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
  .tab:hover  { color: var(--green); }
  .tab.active { color: var(--green); border-bottom-color: var(--green); font-weight: 600; }

  /* ── VERIFY ── */
  .verify-box { background: #fff; border: 2px solid var(--gray-light); border-radius: 8px; padding: 2rem; text-align: center; }
  .verify-icon { font-size: 3rem; margin-bottom: 1rem; }
  .verify-result { margin-top: 1.5rem; padding: 1.5rem; border-radius: var(--radius); }
  .verify-result.valid   { background: #d4edda; border: 1px solid #c3e6cb; }
  .verify-result.invalid { background: #f8d7da; border: 1px solid #f5c6cb; }

  /* ── CHIP ── */
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 0.2rem 0.6rem; background: #e8f5ee; border: 1px solid var(--green); border-radius: 20px; font-size: 0.73rem; color: var(--green); font-weight: 600; }

  /* ── UPLOAD ZONE ── */
  .upload-zone { border: 2px dashed var(--gray-light); border-radius: var(--radius); padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafaf8; }
  .upload-zone:hover { border-color: var(--green); background: #f0f9f4; }
  .upload-zone-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .upload-zone p { font-size: 0.85rem; color: var(--gray); }
  .upload-zone strong { color: var(--green); }

  /* ── UTILS ── */
  .divider { height: 1px; background: var(--gray-light); margin: 1.5rem 0; }
  .flex         { display: flex; }
  .flex-between { display: flex; align-items: center; justify-content: space-between; }
  .flex-center  { display: flex; align-items: center; justify-content: center; }
  .gap-1 { gap: 0.5rem; }
  .gap-2 { gap: 1rem; }
  .gap-3 { gap: 1.5rem; }
  .mb-1 { margin-bottom: 0.5rem; }
  .mb-2 { margin-bottom: 1rem; }
  .mb-3 { margin-bottom: 1.5rem; }
  .mt-1 { margin-top: 0.5rem; }
  .mt-2 { margin-top: 1rem; }
  .text-gray   { color: var(--gray); }
  .text-green  { color: var(--green); }
  .text-gold   { color: var(--gold); }
  .text-red    { color: var(--red); }
  .text-sm     { font-size: 0.82rem; }
  .text-mono   { font-family: var(--font-mono); }
  .text-center { text-align: center; }
  .font-bold   { font-weight: 700; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--gray-light); border-radius: 3px; }
`;

export default globalStyles;
