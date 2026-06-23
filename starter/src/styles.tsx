export const styles = `
  :root {
    --ink: #0B1F3A;          /* brand navy (text + selected pill)            */
    --ink-soft: #274B6D;
    --accent: #B8862F;       /* gold accent (favorites, focus)              */
    --verify: #1F8A5B;       /* green, used ONLY for the verified badge     */
    --surface: #FFFFFF;
    --canvas: #F7F8FA;
    --line: #E7EAEF;
    --muted: #6B7686;
    --radius: 12px;
    --shadow: 0 1px 2px rgba(11,31,58,0.06), 0 8px 24px rgba(11,31,58,0.06);
    /* Want the reference's green look instead? set --ink to #14342E. */
  }
  * { box-sizing: border-box; }
  html, body, #app, #root { height: 100%; margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink);
    background: var(--canvas);
    -webkit-font-smoothing: antialiased;
  }
  .app { display: grid; grid-template-rows: 56px 1fr 36px; height: 100vh; }

  /* Top bar */
  .topbar {
    display: flex; align-items: center; gap: 28px;
    padding: 0 20px; background: var(--surface);
    border-bottom: 1px solid var(--line);
  }
  .brand { display: flex; align-items: center; gap: 9px; }
  .brand__mark { display: inline-flex; }
  .brand__name {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 18px; font-weight: 600; letter-spacing: 0.01em;
  }
  .nav { display: flex; gap: 22px; }
  .nav__link {
    font-size: 14px; color: var(--muted); text-decoration: none;
    padding: 18px 0; border-bottom: 2px solid transparent; transition: color .15s;
  }
  .nav__link:hover { color: var(--ink); }
  .nav__link--active { color: var(--ink); border-bottom-color: var(--ink); font-weight: 600; }
  .topbar__right { margin-left: auto; }
  .topbar__tag {
    font-size: 12px; color: var(--muted);
    background: var(--canvas); border: 1px solid var(--line);
    padding: 5px 10px; border-radius: 999px;
  }

  /* Layout */
  .layout {
    display: grid; grid-template-columns: 380px 1fr; min-height: 0;
    transition: grid-template-columns .25s ease;
  }
  .layout--collapsed { grid-template-columns: 0 1fr; }
  .layout--collapsed .panel { opacity: 0; pointer-events: none; }

  /* Panel */
  .panel {
    background: var(--surface); border-right: 1px solid var(--line);
    display: flex; flex-direction: column; min-height: 0; overflow: hidden;
    transition: opacity .2s ease;
  }
  .panel__bar { padding: 16px 18px 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .result-count { margin: 0; font-size: 13px; color: var(--muted); }
  .result-count strong { color: var(--ink); }
  .panel__controls { display: flex; align-items: center; gap: 8px; }

  /* Toggle */
  .toggle { display: inline-flex; align-items: center; gap: 7px; background: none; border: 0; cursor: pointer; padding: 4px; color: var(--muted); font-size: 12px; }
  .toggle__track { width: 34px; height: 18px; border-radius: 999px; background: #D5DAE2; position: relative; transition: background .15s; }
  .toggle__track.is-on { background: var(--verify); }
  .toggle__thumb { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: transform .15s; }
  .toggle__track.is-on .toggle__thumb { transform: translateX(16px); }

  /* Filters */
  .filters { position: relative; }
  .filters__btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 7px 11px; cursor: pointer; }
  .filters__btn:hover { border-color: #C9CFD9; }
  .filters__btn.is-active { border-color: var(--ink); }
  .filters__count { background: var(--ink); color: #fff; border-radius: 999px; font-size: 11px; min-width: 17px; height: 17px; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px; }
  .filters__panel { position: absolute; right: 0; top: calc(100% + 8px); z-index: 30; width: 220px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px; display: flex; flex-direction: column; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: var(--muted); }
  .field select { font-size: 13px; color: var(--ink); padding: 8px 9px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
  .filters__clear { font-size: 12px; color: var(--accent); background: none; border: 0; cursor: pointer; text-align: left; padding: 0; }

  /* Search */
  .search { position: relative; margin: 0 18px 8px; display: flex; align-items: center; }
  .search__icon { position: absolute; left: 12px; color: var(--muted); pointer-events: none; }
  .search__input { width: 100%; padding: 11px 13px 11px 36px; border: 1px solid var(--line); border-radius: 10px; background: var(--canvas); color: var(--ink); font-size: 14px; outline: none; }
  .search__input::placeholder { color: #9AA3B0; }
  .search__input:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px rgba(184,134,47,.15); }

  /* Result list */
  .result-list { list-style: none; margin: 0; padding: 4px 8px 16px; overflow-y: auto; flex: 1; }
  .row { display: flex; align-items: center; border-radius: 10px; padding-right: 6px; }
  .row:hover { background: var(--canvas); }
  .row--active { background: #F0F3F8; box-shadow: inset 3px 0 0 var(--accent); }
  .row__main { flex: 1; display: flex; align-items: center; gap: 12px; background: none; border: 0; cursor: pointer; text-align: left; padding: 12px 8px 12px 10px; min-width: 0; }
  .avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: #F4EFE3; font-weight: 600; flex-shrink: 0; letter-spacing: .02em; }
  .row__body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .row__line1 { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .row__name { font-weight: 600; font-size: 14px; color: var(--ink); white-space: nowrap; }
  .row__check { display: inline-flex; }
  .row__loc { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row__line2 { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row__fav { opacity: 0; background: none; border: 0; cursor: pointer; padding: 8px; color: var(--muted); transition: opacity .12s; flex-shrink: 0; }
  .row:hover .row__fav, .row__fav.is-fav, .row--active .row__fav { opacity: 1; }
  .result-empty { font-size: 13px; color: var(--muted); line-height: 1.5; padding: 18px 12px; }

  /* Map */
  .map-area { position: relative; }
  .panel-toggle { position: absolute; top: 90px; left: 14px; z-index: 5; width: 34px; height: 34px; border-radius: 8px; background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink); }
  .panel-toggle:hover { background: var(--canvas); }
  .reset-view { position: absolute; top: 134px; left: 14px; z-index: 5; width: 34px; height: 34px; border-radius: 8px; background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink); }
  .reset-view:hover { background: var(--canvas); }
  .reset-view::after { content: "Click home to reset the map"; position: absolute; left: calc(100% + 8px); top: 50%; transform: translateY(-50%); background: var(--ink); color: #fff; font-size: 12px; white-space: nowrap; padding: 5px 9px; border-radius: 6px; pointer-events: none; opacity: 0; transition: opacity .15s; }
  .reset-view:hover::after { opacity: 1; }
  .map-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; padding: 24px; background: var(--canvas); color: var(--muted); }
  .map-placeholder__title { font-size: 16px; font-weight: 600; color: var(--ink); margin: 0 0 6px; }
  .map-placeholder code { background: #E4E8EF; padding: 2px 6px; border-radius: 5px; color: var(--ink); }

  /* Pills (map markers) */
  .pill { display: inline-flex; align-items: center; gap: 5px; background: var(--surface); color: var(--ink); border: 1px solid var(--line); border-radius: 999px; padding: 7px 14px; font-size: 14px; font-weight: 600; box-shadow: 0 0 0 4px rgba(185,134,47,0.55), var(--shadow);; cursor: pointer; white-space: nowrap; transform: translateY(-50%); }
  .pill:hover { border-color: #C9CFD9; }
  .pill__icon { display: inline-flex; color: var(--accent); }
  .pill__check { display: inline-flex; }
  .pill--active { background: var(--ink); color: #F4EFE3; border-color: var(--ink); box-shadow: 0 0 0 4px rgba(185,134,47,0.55), var(--shadow);}
  .pill--active .pill__icon { color: #C9A24B; }

  /* Info window card */
  .agent-card { font-family: inherit; min-width: 220px; }
  .agent-card__head { display: flex; align-items: center; gap: 10px; }
  .agent-card__name { display: flex; align-items: center; gap: 6px; font-size: 18px; font-weight: 700; color: var(--ink); }
  .agent-card__check { display: inline-flex; }
  .agent-card__title { font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 1px; }
  .agent-card__meta { margin: 12px 0 0; display: flex; flex-direction: column; gap: 8px; }
  .agent-card__meta div { display: flex; flex-direction: column; }
  .agent-card__meta dt { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #8A93A1; }
  .agent-card__meta dd { margin: 1px 0 0; font-size: 13px; color: #1E2A3A; }

  /* Footer */
  .footer { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-size: 12px; color: var(--muted); background: var(--surface); border-top: 1px solid var(--line); }
  .footer__muted { color: #9AA3B0; }

  /* Responsive */
  @media (max-width: 820px) {
    .app { grid-template-rows: 56px 1fr 36px; }
    .layout { grid-template-columns: 1fr; grid-template-rows: 46vh 1fr; }
    .layout--collapsed { grid-template-columns: 1fr; grid-template-rows: 0 1fr; }
    .panel { border-right: 0; border-bottom: 1px solid var(--line); }
    .nav { display: none; }
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;
