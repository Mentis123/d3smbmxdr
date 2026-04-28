/**
 * Shared editable-page editor + lock toggle.
 *
 * Usage on any editable page:
 *   <script src="/_kc-editor.js"></script>
 *   <script>kcEditor('your-page-id');</script>
 *
 * Requires (already in the page):
 *   - Elements with `[data-block-id]` for editable blocks
 *   - <span class="edit-status" id="editStatus"></span>
 *   - <button class="lock-toggle" id="lockToggle">…</button>
 *   - <button class="changes-trigger" id="changesTrigger">…</button>
 *   - <div class="changes-panel" id="changesPanel">…<div id="changesList"/></div>
 *   - The CSS classes / animations defined in the page styles
 */
(function(global) {
  global.kcEditor = function(PAGE_ID) {
    const API = '/api/page-edits';
    const LOCK_KEY = 'editLock_' + PAGE_ID;

    function applyLock(locked) {
      document.body.classList.toggle('locked', locked);
      var btn = document.getElementById('lockToggle');
      if (btn) btn.setAttribute('aria-pressed', locked ? 'true' : 'false');
    }
    var urlLocked = new URLSearchParams(window.location.search).has('locked');
    if (urlLocked || localStorage.getItem(LOCK_KEY) === 'locked') applyLock(true);

    const originals = {};
    document.querySelectorAll('[data-block-id]').forEach(function(el) {
      originals[el.getAttribute('data-block-id')] = el.innerHTML;
    });

    let editsMap = {};
    let activeBlock = null;
    let originalContent = '';
    let toolbar = null;
    const statusEl = document.getElementById('editStatus');

    function showStatus(type, text) {
      if (!statusEl) return;
      statusEl.className = 'edit-status ' + type;
      statusEl.textContent = text;
      if (type === 'saved') setTimeout(function() { statusEl.className = 'edit-status'; }, 2000);
    }

    async function loadEdits() {
      try {
        var res = await fetch(API + '?page_id=' + encodeURIComponent(PAGE_ID));
        if (!res.ok) return;
        var data = await res.json();
        editsMap = data.edits || {};
        applyEdits();
        renderChangesPanel();
      } catch (e) { console.error('kcEditor: load failed', e); }
    }

    function applyEdits() {
      for (var blockId in editsMap) {
        var edit = editsMap[blockId];
        var el = document.querySelector('[data-block-id="' + blockId + '"]');
        if (!el) continue;
        if (edit.content !== null && edit.content !== undefined) el.innerHTML = edit.content;
        if (edit.deleted) el.classList.add('deleted'); else el.classList.remove('deleted');
      }
    }

    function getChangeCounts() {
      var edited = 0, deleted = 0;
      for (var k in editsMap) { if (editsMap[k].deleted) deleted++; else edited++; }
      return { edited: edited, deleted: deleted, total: edited + deleted };
    }

    function renderChangesPanel() {
      var counts = getChangeCounts();
      var trigger = document.getElementById('changesTrigger');
      if (!trigger) return;
      var parts = [];
      if (counts.edited) parts.push(counts.edited + ' edited');
      if (counts.deleted) parts.push(counts.deleted + ' deleted');
      trigger.textContent = counts.total > 0 ? 'Changes (' + parts.join(', ') + ')' : 'No Changes';
      trigger.classList.toggle('has-changes', counts.total > 0);
      var sdBtn = document.getElementById('showDeletedBtn');
      if (sdBtn) sdBtn.textContent = counts.deleted > 0 ? 'Show Deleted (' + counts.deleted + ')' : 'Show Deleted';
      var list = document.getElementById('changesList');
      if (!list) return;
      if (counts.total === 0) {
        list.innerHTML = '<div class="changes-panel-empty">No changes yet.<br>Click any text to edit it.</div>';
        return;
      }
      var html = '';
      var entries = Object.keys(editsMap).sort();
      for (var i = 0; i < entries.length; i++) {
        var bid = entries[i];
        var edit = editsMap[bid];
        var isDel = edit.deleted;
        var badgeClass = isDel ? 'deleted-badge' : 'edited';
        var badgeText = isDel ? 'Del' : 'Edit';
        var el = document.querySelector('[data-block-id="' + bid + '"]');
        var label = bid;
        if (el) {
          var text = el.textContent.trim();
          label = text.length > 40 ? text.substring(0, 40) + '...' : (text || bid);
        }
        html += '<div class="change-item">' +
          '<span class="change-badge ' + badgeClass + '">' + badgeText + '</span>' +
          '<span class="change-label" data-goto="' + bid + '" title="' + bid + '">' + label.replace(/</g, '&lt;') + '</span>' +
          '<button class="change-reset" data-reset="' + bid + '">Reset</button>' +
          '</div>';
      }
      list.innerHTML = html;
    }

    async function saveEdit(blockId, content, deleted) {
      showStatus('saving', 'Saving...');
      try {
        var res = await fetch(API, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_id: PAGE_ID, block_id: blockId, content: content, deleted: deleted })
        });
        if (!res.ok) throw new Error('Save failed');
        showStatus('saved', 'Saved');
        editsMap[blockId] = { content: content, deleted: deleted, updated_at: new Date().toISOString() };
        renderChangesPanel();
      } catch (e) { showStatus('error', 'Error saving'); console.error('kcEditor: save failed', e); }
    }

    async function resetBlock(blockId) {
      showStatus('saving', 'Resetting...');
      try {
        var res = await fetch(API, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_id: PAGE_ID, block_id: blockId })
        });
        if (!res.ok) throw new Error('Reset failed');
        showStatus('saved', 'Reset to original');
        delete editsMap[blockId];
        var el = document.querySelector('[data-block-id="' + blockId + '"]');
        if (el && originals[blockId] !== undefined) {
          el.innerHTML = originals[blockId];
          el.classList.remove('deleted');
        }
        renderChangesPanel();
      } catch (e) { showStatus('error', 'Reset failed'); console.error('kcEditor: reset failed', e); }
    }

    function createToolbar() {
      if (toolbar) toolbar.remove();
      toolbar = document.createElement('div');
      toolbar.className = 'edit-toolbar';
      document.body.appendChild(toolbar);
      return toolbar;
    }
    function positionToolbar(el) {
      if (!toolbar) return;
      var rect = el.getBoundingClientRect();
      var top = rect.top - 48;
      var left = rect.left;
      if (rect.top < 60) top = rect.bottom + 8;
      var maxLeft = window.innerWidth - 340;
      if (left > maxLeft) left = maxLeft;
      if (left < 8) left = 8;
      toolbar.style.top = top + 'px';
      toolbar.style.left = left + 'px';
    }
    function enterEdit(el) {
      if (activeBlock) cancelEdit();
      activeBlock = el;
      originalContent = el.innerHTML;
      el.classList.add('editing');
      el.setAttribute('contenteditable', 'true');
      el.focus();
      var blockId = el.getAttribute('data-block-id');
      var isDeleted = el.classList.contains('deleted');
      var hasBeenEdited = blockId in editsMap;
      var tb = createToolbar();
      if (isDeleted) {
        tb.innerHTML =
          '<button class="btn-restore" data-action="restore">Restore</button>' +
          '<button class="btn-cancel" data-action="cancel">Cancel</button>' +
          '<button class="btn-delete" style="background:rgba(251,191,36,0.1);color:#fbbf24;border-color:rgba(251,191,36,0.2)" data-action="reset">Reset to Original</button>';
      } else {
        var buttons =
          '<button class="btn-save" data-action="save">Save</button>' +
          '<button class="btn-cancel" data-action="cancel">Cancel</button>' +
          '<button class="btn-delete" data-action="delete">Delete</button>';
        if (hasBeenEdited) buttons += '<button class="btn-delete" style="background:rgba(251,191,36,0.1);color:#fbbf24;border-color:rgba(251,191,36,0.2)" data-action="reset">Reset</button>';
        tb.innerHTML = buttons;
      }
      tb.addEventListener('click', function(e) {
        var btn = e.target.closest('button[data-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-action');
        if (action === 'save') doSave();
        else if (action === 'cancel') cancelEdit();
        else if (action === 'delete') doDelete();
        else if (action === 'restore') doRestore();
        else if (action === 'reset') doReset();
      });
      positionToolbar(el);
    }
    function cancelEdit() {
      if (!activeBlock) return;
      activeBlock.innerHTML = originalContent;
      activeBlock.classList.remove('editing');
      activeBlock.removeAttribute('contenteditable');
      activeBlock = null; originalContent = '';
      if (toolbar) { toolbar.remove(); toolbar = null; }
    }
    async function doSave() {
      if (!activeBlock) return;
      var blockId = activeBlock.getAttribute('data-block-id');
      var content = activeBlock.innerHTML;
      activeBlock.classList.remove('editing');
      activeBlock.removeAttribute('contenteditable');
      activeBlock.classList.add('just-saved');
      setTimeout(function() { var el = document.querySelector('[data-block-id="' + blockId + '"]'); if (el) el.classList.remove('just-saved'); }, 800);
      if (toolbar) { toolbar.remove(); toolbar = null; }
      activeBlock = null; originalContent = '';
      await saveEdit(blockId, content, false);
    }
    async function doDelete() {
      if (!activeBlock) return;
      var blockId = activeBlock.getAttribute('data-block-id');
      var content = activeBlock.innerHTML;
      activeBlock.classList.remove('editing');
      activeBlock.removeAttribute('contenteditable');
      activeBlock.classList.add('deleted');
      if (toolbar) { toolbar.remove(); toolbar = null; }
      activeBlock = null; originalContent = '';
      await saveEdit(blockId, content, true);
    }
    async function doRestore() {
      if (!activeBlock) return;
      var blockId = activeBlock.getAttribute('data-block-id');
      var content = activeBlock.innerHTML;
      activeBlock.classList.remove('editing', 'deleted');
      activeBlock.removeAttribute('contenteditable');
      if (toolbar) { toolbar.remove(); toolbar = null; }
      activeBlock = null; originalContent = '';
      await saveEdit(blockId, content, false);
    }
    async function doReset() {
      if (!activeBlock) return;
      var blockId = activeBlock.getAttribute('data-block-id');
      activeBlock.classList.remove('editing');
      activeBlock.removeAttribute('contenteditable');
      if (toolbar) { toolbar.remove(); toolbar = null; }
      activeBlock = null; originalContent = '';
      await resetBlock(blockId);
    }

    document.addEventListener('click', function(e) {
      if (document.body.classList.contains('locked')) return;
      if (e.target.closest('.changes-trigger')) {
        var panel = document.getElementById('changesPanel');
        if (panel) panel.classList.toggle('open');
        return;
      }
      if (e.target.closest('.changes-panel')) {
        if (e.target.id === 'showDeletedBtn' || e.target.closest('#showDeletedBtn')) {
          document.body.classList.toggle('show-deleted');
          var sd = document.getElementById('showDeletedBtn');
          if (sd) sd.classList.toggle('active');
          return;
        }
        var resetBtn = e.target.closest('[data-reset]');
        if (resetBtn) {
          if (activeBlock) cancelEdit();
          resetBlock(resetBtn.getAttribute('data-reset'));
          return;
        }
        var gotoLabel = e.target.closest('[data-goto]');
        if (gotoLabel) {
          var bid = gotoLabel.getAttribute('data-goto');
          var target = document.querySelector('[data-block-id="' + bid + '"]');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('just-saved');
            setTimeout(function() { target.classList.remove('just-saved'); }, 1000);
          }
          return;
        }
        return;
      }
      var block = e.target.closest('[data-block-id]');
      if (activeBlock && !block) {
        if (e.target.closest('.edit-toolbar')) return;
        cancelEdit();
        return;
      }
      if (block && block !== activeBlock) {
        // editable block inside an anchor — prevent navigation while editing
        if (e.target.closest('a')) e.preventDefault();
        var panel = document.getElementById('changesPanel');
        if (panel) panel.classList.remove('open');
        enterEdit(block);
      }
    });

    document.addEventListener('keydown', function(e) {
      if (!activeBlock) return;
      if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(); }
    });

    function onReposition() { if (activeBlock && toolbar) positionToolbar(activeBlock); }
    window.addEventListener('scroll', onReposition, { passive: true });
    window.addEventListener('resize', onReposition, { passive: true });

    // Lock toggle wiring
    var lockBtn = document.getElementById('lockToggle');
    if (lockBtn) {
      applyLock(document.body.classList.contains('locked'));
      lockBtn.addEventListener('click', function() {
        var nowLocked = !document.body.classList.contains('locked');
        if (nowLocked) cancelEdit();
        applyLock(nowLocked);
        try { localStorage.setItem(LOCK_KEY, nowLocked ? 'locked' : 'unlocked'); } catch(e) {}
      });
    }

    loadEdits();
  };
})(window);
