#!/usr/bin/env python3
"""Small helper CLI to edit familytree JSON files.

Primary goal: add new people to an existing family-tree JSON (nested `children`).

This repo stores trees as a recursive structure:
  - person fields (id, generation, name, ...)
  - siblings: list[...]
  - children: list[person]

The D3 UI reads `children` to build the hierarchy, so keeping that structure valid
is the key requirement.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import shutil
import sys
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple
import glob


PERSON_KEY_ORDER = [
    "id",
    "generation",
    "name",
    "gender",
    "birth_place",
    "birth_date",
    "death_date",
    "death_place",
    "marriage_date",
    "marriage_place",
    "religion",
    "comment",
    "siblings",
    "children",
]



class ToolError(RuntimeError):
    pass

import tkinter as tk
from tkinter import ttk, messagebox, filedialog


def gui_main():
    modified_people = {}
    added_people = []
    pending_add_parents = []
    pending_edits = {}
    root = tk.Tk()
    root.title("Familytree JSON Editor")
    w, h = 800, 650  # or larger if needed
    root.update_idletasks()
    ws = root.winfo_screenwidth()
    hs = root.winfo_screenheight()
    x = (ws // 2) - (w // 2)
    y = (hs // 2) - (h // 2)
    root.geometry(f"{w}x{h}+{x}+{y}")

    def reload_tree_from_file():
        path = file_var.get()
        nonlocal json_tree
        if not path:
            return
        try:
            json_tree = _load_json(path)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load: {e}")
            return

    
    def delete_selected():
        sel = people_list.curselection()
        if not sel:
            messagebox.showinfo("Warning", "Please select a person first to delete!")
            return
        idx = sel[0]
        if 'visible_people_indices' in globals() and idx < len(visible_people_indices):
            real_idx = visible_people_indices[idx]
        else:
            real_idx = idx
        path, person = people_data[real_idx]
        name = person.get('name', '?')
        idg = f"{person.get('id','?')}.{person.get('generation','?')}"
        if not messagebox.askyesno("Confirm deletion", f"Are you sure you want to delete this person?\n{idg} {name}"):
            return
        
        if not path:
            messagebox.showerror("Error", "Cannot delete the root person!")
            return
        
        parent_path = path[:-1]
        parent_idx = path[-1]
        node = json_tree
        for i in parent_path:
            node = node["children"][i]
        
        if isinstance(node.get("children"), list) and 0 <= parent_idx < len(node["children"]):
            del node["children"][parent_idx]
            load_people()
            messagebox.showinfo("Success", f"{idg} {name} deleted.")
        else:
            messagebox.showerror("Error", "Failed to delete the person.")

    
    btn_frame = ttk.Frame(root)
    btn_frame.pack(side="bottom", fill="x", padx=10, pady=5)
    add_parent_btn = ttk.Button(btn_frame, text="Add Parent", width=18)
    
    def confirm_exit():
        
        unsaved = False
        if modified_people:
            unsaved = True
        if pending_add_parents:
            unsaved = True
        if pending_edits:
            unsaved = True
        if added_people:
            unsaved = True
        if unsaved:
            if not messagebox.askyesno("Confirm exit", "There are unsaved changes. Are you sure you want to exit without saving?"):
                return
        root.destroy()

    exit_btn = ttk.Button(btn_frame, text="Exit", width=15, command=confirm_exit)
    exit_btn.pack(side="right", padx=5)
    save_btn = ttk.Button(btn_frame, text="Save", width=15)
    save_btn.pack(side="right", padx=5)
    del_btn = ttk.Button(btn_frame, text="Delete", command=delete_selected, width=15)
    del_btn.pack(side="right", padx=(20,5))

    
    quick_frame = ttk.Frame(root)
    quick_frame.pack(fill="x", padx=10, pady=5)
    quick_label = ttk.Label(quick_frame, text="Quick open:")
    quick_label.pack(side="left")
    
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.normpath(os.path.join(script_dir, "..", "data"))
    json_files = []
    if os.path.isdir(data_dir):
        json_files = [f for f in glob.glob(os.path.join(data_dir, "*.json"))
                      if os.path.basename(f) != "families.json"]
    def quick_open(path):
        file_var.set(path)
        reload_tree_from_file()
        load_people()
    for f in json_files:
        btn = ttk.Button(quick_frame, text=os.path.basename(f), command=lambda p=f: quick_open(p))
        btn.pack(side="left", padx=2)

    
    file_frame = ttk.Frame(root)
    file_frame.pack(fill="x", padx=10, pady=5)
    file_label = ttk.Label(file_frame, text="JSON file:")
    file_label.pack(side="left")
    file_var = tk.StringVar()
    file_entry = ttk.Entry(file_frame, textvariable=file_var, width=50)
    file_entry.pack(side="left", padx=5)
    def browse_file():
        fname = filedialog.askopenfilename(filetypes=[("JSON files", "*.json")])
        if fname:
            file_var.set(fname)
            reload_tree_from_file()
            load_people()
    browse_btn = ttk.Button(file_frame, text="Browse", command=browse_file)
    browse_btn.pack(side="left")

    
    search_var = tk.StringVar()
    search_frame = ttk.Frame(root)
    search_frame.pack(fill="x", padx=10, pady=(5,0))
    ttk.Label(search_frame, text="Search:").pack(side="left")
    search_entry = ttk.Entry(search_frame, textvariable=search_var, width=40)
    search_entry.pack(side="left", padx=5)

    
    people_list = tk.Listbox(root, width=60, height=10, activestyle='none')
    people_list.pack(padx=10, pady=5)

    
    people_display = []

    fields = [
        ("id", "ID"),
        ("generation", "Generation"),
        ("name", "Name"),
        ("gender", "Gender (male/female)"),
        ("birth_place", "Birth place"),
        ("birth_date", "Birth date"),
        ("death_place", "Death place"),
        ("death_date", "Death date"),
        ("marriage_place", "Marriage place"),
        ("marriage_date", "Marriage date"),
        ("religion", "Religion"),
        ("comment", "Comment"),
    ]
    field_vars = {k: tk.StringVar() for k, _ in fields}

    form_frame = ttk.Frame(root)
    form_frame.pack(fill="x", padx=10, pady=5)
    entry_widgets = {}
    for i, (key, label) in enumerate(fields):
        ttk.Label(form_frame, text=label).grid(row=i, column=0, sticky="e")
        state = "normal"
        if key in ("id", "generation"):
            state = "readonly"
        if key == "gender":
            entry = ttk.Combobox(form_frame, textvariable=field_vars["gender"], values=["male", "female"], width=37, state="readonly")
            entry.grid(row=i, column=1, sticky="w")
            entry_widgets["gender"] = entry
            entry.bind("<FocusOut>", lambda e: update_selected_in_memory())
        elif key == "religion":
            entry = ttk.Combobox(form_frame, textvariable=field_vars["religion"], values=["", "katolikus", "reformatus", "evangelikus"], width=37, state="readonly")
            entry.grid(row=i, column=1, sticky="w")
            entry_widgets["religion"] = entry
            entry.bind("<FocusOut>", lambda e: update_selected_in_memory())
        else:
            entry = ttk.Entry(form_frame, textvariable=field_vars[key], width=40, state=state)
            entry.grid(row=i, column=1, sticky="w")
            entry_widgets[key] = entry
            if key not in ("id", "generation"):
                entry.bind("<FocusOut>", lambda e, k=key: update_selected_in_memory())

    sib_frame = ttk.Frame(form_frame)
    sib_frame.grid(row=len(fields), column=0, columnspan=2, sticky="w", pady=(6,0))
    ttk.Label(sib_frame, text="Siblings:").pack(side="left")
    sib_btn = ttk.Button(sib_frame, text="View...", width=15)
    sib_btn.pack(side="left", padx=6)


    people_data = []
    json_tree = {}

    def load_people():
        nonlocal people_data, json_tree, people_display
        temp = []
        
        for path, person in _iter_people(json_tree):
            try:
                id_val = int(person.get('id', 0))
            except Exception:
                id_val = 0
            try:
                gen_val = int(person.get('generation', 0))
            except Exception:
                gen_val = 0
            display = f"{person.get('id','?')}.{person.get('generation','?')}: {person.get('name','?')}"
            temp.append(((id_val, gen_val), path, person, display))
        
        for ppath, parent_obj in pending_add_parents:
            try:
                id_val = int(parent_obj.get('id', 0))
            except Exception:
                id_val = 0
            try:
                gen_val = int(parent_obj.get('generation', 0))
            except Exception:
                gen_val = 0
            display = f"{parent_obj.get('id','?')}.{parent_obj.get('generation','?')}: {parent_obj.get('name','?')}"
            temp.append(((id_val, gen_val), ppath, parent_obj, display))
        temp.sort(key=lambda x: (x[0][0], x[0][1]))
        people_data = [(path, person) for _, path, person, _ in temp]
        people_display = [display for _, _, _, display in temp]
        update_people_list()

    def _normalize_value(v):
        if v is None:
            return ""
        try:
            s = str(v)
        except Exception:
            return ""
        return s.strip()

    def update_people_list():
        search = search_var.get().strip().lower()
        def norm(s):
            import unicodedata
            return unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ASCII').lower()
        people_list.delete(0, tk.END)
        global visible_people_indices
        global visible_people_indices
        visible_people_indices = []
        for i, display in enumerate(people_display):
            if not search or norm(search) in norm(display):
                idx = people_list.size()
                people_list.insert(tk.END, display)
                visible_people_indices.append(i)
                try:
                    path, person = people_data[i]
                    pid = str(person.get('id', ''))
                    pgen = str(person.get('generation', ''))
                    if any(k[0] == pid and k[1] == pgen for k in pending_edits.keys()):
                        people_list.itemconfig(idx, fg='orange')
                except Exception:
                    pass

    def fill_form(idx):
        # map visible (filtered) index to real index
        if idx < 0 or idx >= len(visible_people_indices):
            return
        real_idx = visible_people_indices[idx]
        path, p = people_data[real_idx]
        for k, _ in fields:
            # If there's a pending_edits modification (by id+generation), show it
            pid = str(p.get('id', ''))
            pgen = str(p.get('generation', ''))
            pending_val = pending_edits.get((pid, pgen, k))
            if pending_val is not None:
                field_vars[k].set(str(pending_val))
            else:
                field_vars[k].set(str(p.get(k, "")))
        entry_widgets["id"].config(state="readonly")
        entry_widgets["generation"].config(state="readonly")

    def on_select(evt):
        try:
            update_selected_in_memory()
        except Exception:
            pass
        sel = people_list.curselection()
        if sel:
            fill_form(sel[0])
            
            if not hasattr(add_parent_btn, '_packed') or not add_parent_btn._packed:
                add_parent_btn.pack(side="left", padx=5)
                add_parent_btn._packed = True
        else:
            if hasattr(add_parent_btn, '_packed') and add_parent_btn._packed:
                add_parent_btn.pack_forget()
                add_parent_btn._packed = False

    add_parent_btn._packed = False
    people_list.bind("<<ListboxSelect>>", on_select)
    def on_search(*_):
        update_people_list()
    search_var.trace_add('write', on_search)

    def clear_form():
        for v in field_vars.values():
            v.set("")
        entry_widgets["id"].config(state="readonly")
        entry_widgets["generation"].config(state="readonly")

    def open_siblings_window():
        pid = field_vars["id"].get()
        pgen = field_vars["generation"].get()
        if not pid:
            messagebox.showinfo("Info", "Please select a person first!")
            return
        person_obj = None
        for _, person in people_data:
            if str(person.get('id','')) == pid and str(person.get('generation','')) == pgen:
                person_obj = person
                break
        if person_obj is None:
            messagebox.showerror("Error", "Person data not found.")
            return

        
        pending = pending_edits.get((str(pid), str(pgen), 'siblings'))
        if pending is not None:
            siblings = list(pending)
        else:
            siblings = list(person_obj.get('siblings') or [])

        sib_win = tk.Toplevel(root)
        sib_win.title(f"Siblings: {field_vars['name'].get()}")
        
        root.update_idletasks()
        rw = root.winfo_width()
        rx = root.winfo_x()
        ry = root.winfo_y()
        px = rx + rw + 20
        py = ry
        
        pw = 700
        ph = 500
        sib_win.geometry(f"{pw}x{ph}+{px}+{py}")
        try:
            sib_win.transient(root)
            sib_win.grab_set()
            sib_win.focus_set()
        except Exception:
            pass

        
        content_frame = ttk.Frame(sib_win)
        content_frame.pack(padx=10, pady=10, fill='both', expand=True)
        left_frame = ttk.Frame(content_frame)
        left_frame.pack(side='left', fill='y', expand=False)
        right_frame = ttk.Frame(content_frame)
        right_frame.pack(side='left', fill='both', expand=True, padx=(10,0))

        
        listbox = tk.Listbox(left_frame, width=34, height=20, activestyle='none')
        listbox.pack(side='left', fill='both', expand=True)
        lb_scroll = ttk.Scrollbar(left_frame, orient='vertical', command=listbox.yview)
        lb_scroll.pack(side='right', fill='y')
        listbox.config(yscrollcommand=lb_scroll.set)

        
        detail_keys = [
            ('sibling_id', 'ID'),
            ('sibling_name', 'Name'),
            ('sibling_birth_place', 'Birth place'),
            ('sibling_birth_date', 'Birth date'),
            ('sibling_death_place', 'Death place'),
            ('sibling_death_date', 'Death date'),
            ('sibling_spouse_name', 'Spouse name'),
            ('sibling_marriage_place', 'Marriage place'),
            ('sibling_marriage_date', 'Marriage date'),
            
        ]
        detail_vars = {k: tk.StringVar() for k,_ in detail_keys}
        
        current_sib_idx = {'idx': None}
        
        canvas = tk.Canvas(right_frame, borderwidth=0, highlightthickness=0)
        vsb = ttk.Scrollbar(right_frame, orient='vertical', command=canvas.yview)
        canvas.configure(yscrollcommand=vsb.set)
        vsb.pack(side='right', fill='y')
        canvas.pack(side='left', fill='both', expand=True)
        form_frame_s = ttk.Frame(canvas)
        canvas.create_window((0,0), window=form_frame_s, anchor='nw')
        def _on_frame_config(event):
            canvas.configure(scrollregion=canvas.bbox('all'))
        form_frame_s.bind('<Configure>', _on_frame_config)
        for i, (k,label) in enumerate(detail_keys):
            ttk.Label(form_frame_s, text=label+':').grid(row=i, column=0, sticky='e', padx=(2,4), pady=2)
            
            state = 'normal'
            e = ttk.Entry(form_frame_s, textvariable=detail_vars[k], width=50, state=state)
            e.grid(row=i, column=1, sticky='we', padx=(6,0), pady=2)
            if state != 'readonly':
                e.bind('<FocusOut>', lambda ev, _k=k: commit_current_edit())
            form_frame_s.columnconfigure(1, weight=1)

        

        def refresh_sib_list():
            
            prev_idx = current_sib_idx.get('idx')
            listbox.delete(0, tk.END)
            for s in siblings:
                sid = s.get('sibling_id', s.get('id', '?'))
                sname = s.get('sibling_name', s.get('name', '?'))
                listbox.insert(tk.END, f"{sid}: {sname}")
            
            try:
                if prev_idx is not None and 0 <= prev_idx < len(siblings):
                    listbox.selection_clear(0, tk.END)
                    listbox.selection_set(prev_idx)
                    listbox.see(prev_idx)
            except Exception:
                pass

        def commit_current_edit():
            ci = current_sib_idx.get('idx')
            if ci is None or ci < 0 or ci >= len(siblings):
                return
            s = siblings[ci]
            changed = False
            for k,_ in detail_keys:
                newv = detail_vars[k].get()
                oldv = s.get(k)
                if _normalize_value(oldv) != _normalize_value(newv):
                    s[k] = newv
                    changed = True

            
            def _norm_sibs(lst):
                out = []
                for ent in (lst or []):
                    row = []
                    for kk, _ in detail_keys:
                        val = ent.get(kk)
                        if val is None and kk.startswith('sibling_'):
                            alt = kk[len('sibling_'):]
                            val = ent.get(alt)
                        row.append(_normalize_value(val))
                    out.append(row)
                return out

            orig_sibs = _norm_sibs(person_obj.get('siblings') or [])
            cur_sibs = _norm_sibs(siblings)

            if cur_sibs == orig_sibs:
                
                pending_edits.pop((str(pid), str(pgen), 'siblings'), None)
                
                key = f"{pid}.{pgen}: {field_vars['name'].get()}"
                still_pending = any(k0 == str(pid) and k1 == str(pgen) for (k0,k1,_f) in pending_edits.keys())
                if not still_pending:
                    modified_people.pop(key, None)
            else:
                
                if changed or True:
                    pending_edits[(str(pid), str(pgen), 'siblings')] = list(siblings)
                    key = f"{pid}.{pgen}: {field_vars['name'].get()}"
                    modified_people[key] = modified_people.get(key, {})

            refresh_sib_list()
            
            try:
                if ci is not None and 0 <= ci < listbox.size():
                    listbox.selection_clear(0, tk.END)
                    listbox.selection_set(ci)
                    listbox.see(ci)
            except Exception:
                pass
            try:
                update_people_list()
            except Exception:
                pass

        def show_details(event=None):
            # Preserve the user's intended selection across commit_current_edit,
            # because commit_current_edit may refresh and restore the old selection.
            try:
                sel = listbox.curselection()
            except Exception:
                sel = ()
            new_idx = sel[0] if sel else None

            try:
                # Commit edits for the previously selected sibling (if any).
                commit_current_edit()
            except Exception:
                pass

            if new_idx is None:
                current_sib_idx['idx'] = None
                for k in detail_vars:
                    detail_vars[k].set("")
                return

            # Restore the user's selection and show details for it.
            try:
                listbox.selection_clear(0, tk.END)
                listbox.selection_set(new_idx)
                listbox.see(new_idx)
            except Exception:
                pass
            idx = new_idx
            current_sib_idx['idx'] = idx
            s = siblings[idx]
            for k,_ in detail_keys:
                val = s.get(k)
                if val is None and k.startswith('sibling_'):
                    alt = k[len('sibling_'):]
                    val = s.get(alt)
                detail_vars[k].set(_normalize_value(val))

        listbox.bind('<<ListboxSelect>>', show_details)

        def add_sibling_dialog(prefill=None, index=None):
            dlg = tk.Toplevel(sib_win)
            dlg.title('Sibling')
            
            try:
                dlg.transient(sib_win)
                # Release siblings window grab before taking grab on the dialog
                try:
                    sib_win.grab_release()
                except Exception:
                    pass
                dlg.grab_set()
                dlg.focus_set()
            except Exception:
                pass
            
            try:
                sib_win.update_idletasks()
                sw = sib_win.winfo_width()
                sh = sib_win.winfo_height()
                sx = sib_win.winfo_x()
                sy = sib_win.winfo_y()
                dw = 480
                dh = min(420, max(260, int(sh * 0.6)))
                
                dx = sx + max(0, (sw - dw) // 2)
                dy_above = sy - dh - 10
                if dy_above >= 0:
                    dy = dy_above
                else:
                    dy = sy + sh + 10
                dlg.geometry(f"{dw}x{dh}+{dx}+{dy}")
            except Exception:
                pass
            fields_s = [
                ('sibling_id', 'ID'),
                ('sibling_name', 'Name'),
                ('sibling_birth_place', 'Birth place'),
                ('sibling_birth_date', 'Birth date'),
                ('sibling_death_place', 'Death place'),
                ('sibling_death_date', 'Death date'),
                ('sibling_spouse_name', 'Spouse name'),
                ('sibling_marriage_place', 'Marriage place'),
                ('sibling_marriage_date', 'Marriage date'),
                
            ]
            svars = {k: tk.StringVar() for k,_ in fields_s}
            if prefill:
                for k,_ in fields_s:
                    svars[k].set(prefill.get(k, ''))
            for i, (k,label) in enumerate(fields_s):
                ttk.Label(dlg, text=label).grid(row=i, column=0, sticky='e')
                ttk.Entry(dlg, textvariable=svars[k], width=40).grid(row=i, column=1, sticky='w')

            def do_save():
                new = {k: svars[k].get() for k,_ in fields_s}
                if index is None:
                    siblings.append(new)
                else:
                    siblings[index] = new
                pending_edits[(str(pid), str(pgen), 'siblings')] = list(siblings)
                key = f"{pid}.{pgen}: {field_vars['name'].get()}"
                modified_people[key] = modified_people.get(key, {})
                refresh_sib_list()
                try:
                    update_people_list()
                except Exception:
                    pass
                dlg.destroy()

            btnf = ttk.Frame(dlg)
            btnf.grid(row=len(fields_s), column=0, columnspan=2, pady=8)
            ttk.Button(btnf, text='Save', command=do_save).pack(side='left', padx=5)
            ttk.Button(btnf, text='Cancel', command=dlg.destroy).pack(side='left', padx=5)

            try:
                dlg.wait_window()
            except Exception:
                pass
            finally:
                # Ensure the dialog's grab is released and restore focus to the siblings window/list
                try:
                    dlg.grab_release()
                except Exception:
                    pass
                try:
                    sib_win.grab_set()
                    sib_win.lift()
                    sib_win.focus_set()
                    listbox.focus_set()
                except Exception:
                    pass

        
        def delete_selected():
            sel = listbox.curselection()
            if not sel:
                messagebox.showinfo('Info', 'Please select a sibling to delete!')
                return
            idx = sel[0]
            if not messagebox.askyesno('Delete', 'Are you sure you want to delete the selected sibling?'):
                return
            del siblings[idx]
            pending_edits[(str(pid), str(pgen), 'siblings')] = list(siblings)
            key = f"{pid}.{pgen}: {field_vars['name'].get()}"
            modified_people[key] = modified_people.get(key, {})
            refresh_sib_list()
            try:
                update_people_list()
            except Exception:
                pass

        
        def on_close():
            try:
                commit_current_edit()
            except Exception:
                pass
            try:
                sib_win.destroy()
            except Exception:
                pass

        refresh_sib_list()

        btn_frame = ttk.Frame(sib_win)
        btn_frame.pack(fill='x', padx=10, pady=6)
        ttk.Button(btn_frame, text='Add New', command=lambda: add_sibling_dialog()).pack(side='left')
        ttk.Button(btn_frame, text='Delete', command=delete_selected).pack(side='left')
        ttk.Button(btn_frame, text='Close', command=on_close).pack(side='right')
        sib_win.protocol('WM_DELETE_WINDOW', on_close)
        try:
            sib_win.wait_window()
        except Exception:
            pass

    
    try:
        sib_btn.config(command=open_siblings_window)
    except Exception:
        pass


    def add_parent_to_selected():
        sel = people_list.curselection()
        if not sel:
            messagebox.showinfo("Warning", "Select a person first to add a parent to.")
            return
        idx = sel[0]
        if 'visible_people_indices' in globals() and idx < len(visible_people_indices):
            real_idx = visible_people_indices[idx]
        else:
            real_idx = idx
        path, person = people_data[real_idx]
        
        if not path:
            messagebox.showinfo("Warning", "You cannot add a parent to the tree root (top person).")
            return
        # The 'children' field contains the parents in this model
        parents = person.get("children")
        if not isinstance(parents, list):
            parents = []
            person["children"] = parents
        male_count = sum(1 for p in parents if isinstance(p, dict) and p.get("gender") == "male")
        female_count = sum(1 for p in parents if isinstance(p, dict) and p.get("gender") == "female")
        if male_count >= 1 and female_count >= 1:
            apa = next((p for p in parents if isinstance(p, dict) and p.get("gender") == "male"), None)
            anya = next((p for p in parents if isinstance(p, dict) and p.get("gender") == "female"), None)
            apa_str = f"{apa.get('id','?')}.{apa.get('generation','?')} {apa.get('name','?')}" if apa else "?"
            anya_str = f"{anya.get('id','?')}.{anya.get('generation','?')} {anya.get('name','?')}" if anya else "?"
            msg = f"Parents already exist!\nFather: {apa_str}\nMother: {anya_str}"
            messagebox.showinfo("Warning", msg)
            return
        if male_count + female_count >= 2:
            messagebox.showinfo("Warning", "A person can have at most two parents!")
            return
        existing_genders = {p.get("gender") for p in parents if isinstance(p, dict)}
        # Open a dialog to enter parent data (name, gender, etc.)
        parent_win = tk.Toplevel(root)
        parent_win.title("Add Parent")
        
        root.update_idletasks()
        rw = root.winfo_width()
        rh = root.winfo_height()
        rx = root.winfo_x()
        ry = root.winfo_y()
        pw = 350
        ph = 350
        px = rx + rw + 20
        py = ry
        parent_win.geometry(f"{pw}x{ph}+{px}+{py}")
        try:
            parent_win.transient(root)
            parent_win.grab_set()
            parent_win.focus_set()
        except Exception:
            pass
        
        allowed_genders = []
        if "male" not in existing_genders:
            allowed_genders.append("male")
        if "female" not in existing_genders:
            allowed_genders.append("female")
        if not allowed_genders:
            messagebox.showinfo("Warning", "A male and a female parent already exist!")
            parent_win.destroy()
            return
        
        pvars = {k: tk.StringVar() for k, _ in fields if k not in ("id", "generation")}
        row = 0
        for k, label in fields:
            if k in ("id", "generation"): continue
            ttk.Label(parent_win, text=label).grid(row=row, column=0, sticky="e")
            if k == "gender":
                combo = ttk.Combobox(parent_win, textvariable=pvars[k], values=allowed_genders, state="readonly")
                combo.grid(row=row, column=1, sticky="w")
                if allowed_genders:
                    pvars[k].set(allowed_genders[0])
            else:
                ttk.Entry(parent_win, textvariable=pvars[k], width=30).grid(row=row, column=1, sticky="w")
            row += 1

        def do_add():
            
            try:
                child_id = int(person.get("id", 0))
            except Exception:
                messagebox.showerror("Error", "Selected person's ID is not numeric!")
                parent_win.destroy()
                return
            gender = pvars["gender"].get()
            if gender == "male":
                new_id = str(child_id * 2)
            elif gender == "female":
                new_id = str(child_id * 2 + 1)
            else:
                messagebox.showerror("Error", "Parent gender must be 'male' or 'female'!")
                parent_win.destroy()
                return
            try:
                child_gen = int(str(person.get("generation", "0")))
                parent_gen = child_gen + 1
            except Exception:
                parent_gen = 1
            parent_obj = {"id": new_id, "generation": str(parent_gen)}
            for k in pvars:
                parent_obj[k] = pvars[k].get()
            # Do not include unnecessary fields unless they have values
            if not parent_obj.get("children"): parent_obj["children"] = []
            if not parent_obj.get("siblings"): parent_obj["siblings"] = []
            # We only record the addition in memory; do not write it to the tree immediately
            pending_add_parents.append((path.copy(), parent_obj.copy()))
            modified_people[f"{person.get('id','?')}.{person.get('generation','?')}: {person.get('name','?')}"] = {"children": ("previous parents", "new parent added (on save)")}
            added_people.append((f"{parent_obj.get('id','?')}.{parent_obj.get('generation','?')}: {parent_obj.get('name','?')}", parent_obj.copy()))
            # Show it immediately in the GUI but only visually (do not modify json_tree)
            # We refresh people_data/people_display for visibility, but not the json_tree
            # (for simplicity we only show a notification here)
            search_var.set("")
            load_people()
            parent_win.destroy()
            messagebox.showinfo("Success", f"Parent added (ID: {new_id}). It will be written to the tree when you press Save.")
        btn_frame = tk.Frame(parent_win)
        btn_frame.grid(row=row, column=0, columnspan=2, pady=8)
        add_btn = ttk.Button(btn_frame, text="Add", command=do_add)
        add_btn.pack(side=tk.LEFT, padx=5)
        def cancel_add():
            parent_win.destroy()
        cancel_btn = ttk.Button(btn_frame, text="Cancel", command=cancel_add)
        cancel_btn.pack(side=tk.LEFT, padx=5)

        try:
            parent_win.wait_window()
        except Exception:
            pass

    add_parent_btn.config(command=add_parent_to_selected)


    def update_selected_in_memory():
        # Always save the person currently shown in the form, not the listbox selection
        id_val = field_vars["id"].get()
        gen_val = field_vars["generation"].get()
        idx = None
        path = None
        p = None
        for i, (ppath, person) in enumerate(people_data):
            if str(person.get("id", "")) == id_val and str(person.get("generation", "")) == gen_val:
                idx = i
                path = ppath
                p = person
                break
        if path is None or p is None:
            return
        # Update pending_edits for each field; remove pending entry if reverted
        idstr = str(p.get('id', ''))
        genstr = str(p.get('generation', ''))
        for k, _ in fields:
            old = p.get(k, "")
            new = field_vars[k].get()
            old_n = _normalize_value(old)
            new_n = _normalize_value(new)
            key = (idstr, genstr, k)
            if old_n != new_n:
                pending_edits[key] = new
            else:
                # If value equals original, remove any staged edit for this field
                if key in pending_edits:
                    try:
                        del pending_edits[key]
                    except Exception:
                        pending_edits.pop(key, None)

        # If any pending edits remain for this person, mark as modified; otherwise clear mark
        person_key = f"{idstr}.{genstr}: {p.get('name','?')}"
        still_pending = any(k0 == idstr and k1 == genstr for (k0, k1, _f) in pending_edits.keys())
        if still_pending:
            # Build a compact changes dict for display
            changes = {}
            for (k0, k1, field) in list(pending_edits.keys()):
                if k0 == idstr and k1 == genstr:
                    changes[field] = (p.get(field, ""), pending_edits.get((k0, k1, field)))
            modified_people[person_key] = changes
        else:
            modified_people.pop(person_key, None)

        # Update displayed name in the list and refresh the visible list while preserving selection
        if idx is not None:
            # update people_display for this person
            try:
                people_display[idx] = f"{field_vars['id'].get()}.{field_vars['generation'].get()}: {field_vars['name'].get()}"
            except Exception:
                pass
            # Preserve current visible selection (real index) if any
            cur_sel = people_list.curselection()
            cur_real = None
            try:
                if cur_sel:
                    cur_real = visible_people_indices[cur_sel[0]]
            except Exception:
                cur_real = None
            update_people_list()
            # restore selection to the same real index if it is visible now
            try:
                if cur_real is not None:
                    for vi, real_i in enumerate(visible_people_indices):
                        if real_i == cur_real:
                            people_list.selection_clear(0, tk.END)
                            people_list.selection_set(vi)
                            people_list.see(vi)
                            break
            except Exception:
                pass

    def save_all():
        path = file_var.get()
        if not path:
            messagebox.showerror("Error", "Please choose a JSON file first!")
            return
        # Summary of changes
        summary = ""
        if modified_people:
            summary += "Modified people:\n"
            for person in modified_people.keys():
                summary += f"- {person}\n"
        if added_people:
            summary += "Added people:\n"
            for key, pdata in sorted(added_people, key=lambda x: x[0]):
                summary += f"- {key}\n"
        if summary:
            summary += "\nAre you sure you want to save these changes?"
            if not messagebox.askyesno("Confirm Save", summary):
                return
        # Apply all pending_add_parents to the json_tree
        for ppath, parent_obj in pending_add_parents:
            node = json_tree
            for i in ppath:
                node = node["children"][i]
            if "children" not in node or not isinstance(node["children"], list):
                node["children"] = []
            node["children"].append(parent_obj)
        pending_add_parents.clear()
        # Apply all pending_edits to the json_tree
        # pending_edits kulcs: (id_str, generation_str, key)
        for (pid, pgen, key), value in list(pending_edits.items()):
            node_found = None
            for ppath, person in _iter_people(json_tree):
                if str(person.get('id', '')) == pid and str(person.get('generation', '')) == pgen:
                    node_found = person
                    break
            if node_found is not None:
                node_found[key] = value
        pending_edits.clear()
        try:
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(_dump_json(json_tree))
            messagebox.showinfo("Success", "Saved!")
            modified_people.clear()
            added_people.clear()
            # Reset listbox item colors
            try:
                for i in range(people_list.size()):
                    people_list.itemconfig(i, fg='black')
            except Exception:
                pass
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save: {e}")

    def add_to_tree():
        # Add new person as child of selected parent (or root if none)
        parent_idx = people_list.curselection()
        if parent_idx:
            parent_path, parent = people_data[parent_idx[0]]
        else:
            parent_path, parent = [], json_tree
        # Find generation
        try:
            parent_gen = int(str(parent.get("generation", "0")))
        except Exception:
            parent_gen = 0
        child_gen = parent_gen + 1
        # Build person
        person = {k: field_vars[k].get() for k, _ in fields}
        person["generation"] = str(child_gen)
        if "children" not in parent or parent["children"] is None:
            parent["children"] = []
        if not isinstance(parent["children"], list):
            messagebox.showerror("Error", "The parent's 'children' field is not a list!")
            return
        parent["children"].append(person)
        # Refresh the list
        load_people()
        messagebox.showinfo("Success", "New person added (press Save to write to file)")


    def save_and_update():
        update_selected_in_memory()
        save_all()

    save_btn.config(command=save_and_update)

    root.mainloop()



def _ensure_utf8_stdio() -> None:
    """Best-effort: make stdout/stderr UTF-8 to avoid UnicodeEncodeError on Windows."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except Exception:
            pass


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _dump_json(obj: Any) -> str:
    # Match the repo style reasonably well: tabs + UTF-8.
    return json.dumps(obj, ensure_ascii=False, indent="\t") + "\n"


def _write_with_backup(path: str, content: str, make_backup: bool) -> str:
    backup_path = ""
    if make_backup and os.path.exists(path):
        ts = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_path = f"{path}.bak-{ts}"
        shutil.copy2(path, backup_path)

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

    return backup_path


def _iter_people(root: Dict[str, Any]) -> Iterable[Tuple[List[int], Dict[str, Any]]]:
    """Yield (path, person) for every node. Path is list of child indexes. Recursively traverses all 'children' lists (parents and descendants)."""

    def rec(node: Dict[str, Any], path: List[int]) -> Iterable[Tuple[List[int], Dict[str, Any]]]:
        yield path, node
        # Traverse all children (which are parents in this model)
        children = node.get("children") or []
        if isinstance(children, list):
            for i, child in enumerate(children):
                if isinstance(child, dict):
                    yield from rec(child, path + [i])

    yield from rec(root, [])


def _as_str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    return str(value)


def _sync_siblings_among_children(children: List[Dict[str, Any]]) -> int:
    """Rebuild the `siblings` list for each child based on its siblings in the same children list.

    Returns the number of person nodes updated.
    """
    updated = 0
    for child in children:
        if not isinstance(child, dict):
            continue
        child_id = _as_str(child.get("id"))
        child_gen = _as_str(child.get("generation"))

        entries: List[Dict[str, Any]] = []
        idx = 1
        for sib in children:
            if sib is child or not isinstance(sib, dict):
                continue
            entries.append(
                {
                    "sibling_id": f"{child_id}.{child_gen}.{idx}",
                    "sibling_name": _as_str(sib.get("name"), "?"),
                    "sibling_birth_place": _as_str(sib.get("birth_place"), "?"),
                    "sibling_birth_date": _as_str(sib.get("birth_date"), "?"),
                    "sibling_death_place": _as_str(sib.get("death_place"), "?"),
                    "sibling_death_date": _as_str(sib.get("death_date"), "?"),
                    # Spouse name is not stored on person nodes in this repo, so leave blank.
                    "sibling_spouse_name": "",
                    "sibling_marriage_place": _as_str(sib.get("marriage_place"), ""),
                    "sibling_marriage_date": _as_str(sib.get("marriage_date"), ""),
                }
            )
            idx += 1

        child["siblings"] = entries
        updated += 1

    return updated


def _sync_siblings_for_tree(root: Dict[str, Any], *, only_parent_id: Optional[str], only_parent_generation: Optional[int]) -> int:
    """Sync siblings for children of each parent in the tree.

    If only_parent_id is provided, only that parent node's children are synchronized.
    """
    total_updated = 0
    for _, node in _iter_people(root):
        if not isinstance(node, dict):
            continue
        if only_parent_id is not None:
            if _as_str(node.get("id")) != _as_str(only_parent_id):
                continue
            if only_parent_generation is not None and _as_str(node.get("generation")) != str(only_parent_generation):
                continue

        children = node.get("children")
        if not children or not isinstance(children, list):
            continue

        # Only sync among direct siblings (same parent)
        dict_children = [c for c in children if isinstance(c, dict)]
        if not dict_children:
            continue
        total_updated += _sync_siblings_among_children(dict_children)

        # If we were targeting only one parent, stop after the first match.
        if only_parent_id is not None:
            break

    return total_updated


def _path_to_str(path: List[int]) -> str:
    if not path:
        return "root"
    return "children[" + "][".join(str(i) for i in path) + "]"


def _find_people_by_id(root: Dict[str, Any], person_id: str) -> List[Tuple[List[int], Dict[str, Any]]]:
    matches: List[Tuple[List[int], Dict[str, Any]]] = []
    for path, person in _iter_people(root):
        if str(person.get("id", "")) == str(person_id):
            matches.append((path, person))
    return matches


def _collect_numeric_ids(root: Dict[str, Any]) -> List[int]:
    ids: List[int] = []
    for _, person in _iter_people(root):
        raw = person.get("id")
        try:
            ids.append(int(str(raw)))
        except Exception:
            pass
    return ids


def _make_person(
    *,
    person_id: str,
    generation: int,
    name: str,
    gender: str,
    preset: str,
    religion: str,
    birth_place: Optional[str],
    birth_date: Optional[str],
    death_place: Optional[str],
    death_date: Optional[str],
    marriage_place: Optional[str],
    marriage_date: Optional[str],
    comment: str,
) -> Dict[str, Any]:
    if preset == "private":
        default_place = "private"
        default_date = "private"
    elif preset == "unknown":
        default_place = "?"
        default_date = "?"
    elif preset == "blank":
        default_place = ""
        default_date = ""
    else:
        raise ToolError(f"Unknown preset: {preset}")

    obj: Dict[str, Any] = {
        "id": str(person_id),
        "generation": str(generation),
        "name": name,
        "gender": gender,
        "birth_place": birth_place if birth_place is not None else default_place,
        "birth_date": birth_date if birth_date is not None else default_date,
        "death_date": death_date if death_date is not None else default_date,
        "death_place": death_place if death_place is not None else default_place,
        "marriage_date": marriage_date if marriage_date is not None else "",
        "marriage_place": marriage_place if marriage_place is not None else "",
        "religion": religion,
        "comment": comment,
        "siblings": [],
        "children": [],
    }

    # Re-order keys consistently
    ordered = {k: obj.get(k) for k in PERSON_KEY_ORDER if k in obj}
    # Keep any extra keys (none expected) at the end
    for k, v in obj.items():
        if k not in ordered:
            ordered[k] = v
    return ordered


def cmd_add_child(args: argparse.Namespace) -> int:
    tree = _load_json(args.file)
    if not isinstance(tree, dict):
        raise ToolError("Top-level JSON must be an object (root person)")

    matches = _find_people_by_id(tree, args.parent_id)
    if not matches:
        raise ToolError(f"Parent id '{args.parent_id}' not found in {args.file}")

    if args.parent_generation is not None:
        matches = [(p, n) for (p, n) in matches if str(n.get("generation")) == str(args.parent_generation)]
        if not matches:
            raise ToolError(f"Parent id '{args.parent_id}' found, but no node with generation '{args.parent_generation}'")

    if len(matches) > 1:
        lines = [f"Parent id '{args.parent_id}' matched multiple nodes. Please add --parent-generation."]
        for path, node in matches:
            lines.append(
                f"- {_path_to_str(path)}: id={node.get('id')} gen={node.get('generation')} name={node.get('name')}"
            )
        raise ToolError("\n".join(lines))

    parent_path, parent = matches[0]
    try:
        parent_gen = int(str(parent.get("generation", "0")))
    except Exception:
        raise ToolError("Parent has non-numeric 'generation'")

    child_gen = parent_gen + 1

    if args.id is None:
        existing = _collect_numeric_ids(tree)
        next_id = (max(existing) + 1) if existing else 1
        child_id = str(next_id)
    else:
        child_id = str(args.id)

    # Basic duplicate check (id within the tree)
    dup = _find_people_by_id(tree, child_id)
    if dup:
        raise ToolError(f"Child id '{child_id}' already exists in the tree. Provide --id or remove duplicates.")

    child = _make_person(
        person_id=child_id,
        generation=child_gen,
        name=args.name,
        gender=args.gender,
        preset=args.preset,
        religion=args.religion,
        birth_place=args.birth_place,
        birth_date=args.birth_date,
        death_place=args.death_place,
        death_date=args.death_date,
        marriage_place=args.marriage_place,
        marriage_date=args.marriage_date,
        comment=args.comment or "",
    )

    if "children" not in parent or parent["children"] is None:
        parent["children"] = []
    if not isinstance(parent["children"], list):
        raise ToolError("Parent 'children' field exists but is not a list")

    parent["children"].append(child)

    if not args.no_sync_siblings:
        # Refresh siblings for the parent's children set (including the new child).
        _sync_siblings_among_children([c for c in parent["children"] if isinstance(c, dict)])

    if args.dry_run:
        sys.stdout.write(_dump_json(tree))
        return 0

    backup = _write_with_backup(args.file, _dump_json(tree), make_backup=not args.no_backup)
    if backup:
        print(f"Saved. Backup: {backup}")
    else:
        print("Saved.")
    print(
        f"Added child id={child_id} gen={child_gen} under parent id={parent.get('id')} gen={parent.get('generation')} at {_path_to_str(parent_path)}"
    )
    return 0


def cmd_sync_siblings(args: argparse.Namespace) -> int:
    tree = _load_json(args.file)
    if not isinstance(tree, dict):
        raise ToolError("Top-level JSON must be an object (root person)")

    updated = _sync_siblings_for_tree(
        tree,
        only_parent_id=args.parent_id,
        only_parent_generation=args.parent_generation,
    )

    if updated == 0:
        if args.parent_id is not None:
            raise ToolError("No matching parent found (or parent has no children)")

    if args.dry_run:
        sys.stdout.write(_dump_json(tree))
        return 0

    backup = _write_with_backup(args.file, _dump_json(tree), make_backup=not args.no_backup)
    if backup:
        print(f"Saved. Backup: {backup}")
    else:
        print("Saved.")
    print(f"Siblings synchronized for {updated} person node(s).")
    return 0


def cmd_update_person(args: argparse.Namespace) -> int:
    tree = _load_json(args.file)
    if not isinstance(tree, dict):
        raise ToolError("Top-level JSON must be an object (root person)")

    matches = _find_people_by_id(tree, args.person_id)
    if not matches:
        raise ToolError(f"Person id '{args.person_id}' not found in {args.file}")

    if args.generation is not None:
        matches = [(p, n) for (p, n) in matches if str(n.get("generation")) == str(args.generation)]
        if not matches:
            raise ToolError(f"Person id '{args.person_id}' found, but no node with generation '{args.generation}'")

    if len(matches) > 1:
        lines = [f"Person id '{args.person_id}' matched multiple nodes. Please add --generation."]
        for path, node in matches:
            lines.append(
                f"- {_path_to_str(path)}: id={node.get('id')} gen={node.get('generation')} name={node.get('name')}"
            )
        raise ToolError("\n".join(lines))

    _, person = matches[0]

    # Track what was updated
    updated_fields: List[str] = []

    # Update fields if provided
    if args.name is not None:
        person["name"] = args.name
        updated_fields.append("name")
    if args.gender is not None:
        person["gender"] = args.gender
        updated_fields.append("gender")
    if args.birth_place is not None:
        person["birth_place"] = args.birth_place
        updated_fields.append("birth_place")
    if args.birth_date is not None:
        person["birth_date"] = args.birth_date
        updated_fields.append("birth_date")
    if args.death_place is not None:
        person["death_place"] = args.death_place
        updated_fields.append("death_place")
    if args.death_date is not None:
        person["death_date"] = args.death_date
        updated_fields.append("death_date")
    if args.marriage_place is not None:
        person["marriage_place"] = args.marriage_place
        updated_fields.append("marriage_place")
    if args.marriage_date is not None:
        person["marriage_date"] = args.marriage_date
        updated_fields.append("marriage_date")
    if args.religion is not None:
        person["religion"] = args.religion
        updated_fields.append("religion")
    if args.comment is not None:
        person["comment"] = args.comment
        updated_fields.append("comment")

    if not updated_fields:
        raise ToolError("No fields to update. Provide at least one field to change.")

    # Re-order keys consistently
    ordered = {k: person.get(k) for k in PERSON_KEY_ORDER if k in person}
    for k, v in person.items():
        if k not in ordered:
            ordered[k] = v
    person.clear()
    person.update(ordered)

    if args.dry_run:
        sys.stdout.write(_dump_json(tree))
        return 0

    backup = _write_with_backup(args.file, _dump_json(tree), make_backup=not args.no_backup)
    if backup:
        print(f"Saved. Backup: {backup}")
    else:
        print("Saved.")
    print(f"Updated person id={person.get('id')} gen={person.get('generation')}: {', '.join(updated_fields)}")
    return 0


def cmd_list_ids(args: argparse.Namespace) -> int:
    tree = _load_json(args.file)
    if not isinstance(tree, dict):
        raise ToolError("Top-level JSON must be an object (root person)")

    rows: List[Tuple[int, str, str, str]] = []
    for path, person in _iter_people(tree):
        gen = str(person.get("generation", ""))
        pid = str(person.get("id", ""))
        name = str(person.get("name", ""))
        rows.append((len(path), pid, gen, name))

    # stable-ish sort: by generation numeric then id numeric if possible
    def sort_key(r: Tuple[int, str, str, str]):
        _, pid, gen, _ = r
        try:
            g = int(gen)
        except Exception:
            g = 10**9
        try:
            p = int(pid)
        except Exception:
            p = 10**9
        return (g, p, pid)

    rows.sort(key=sort_key)

    for _, pid, gen, name in rows:
        print(f"{pid}.{gen}\t{name}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="familytree_json_tool",
        description="Small helper to add people to familytree JSON files (nested children structure).",
    )
    sub = p.add_subparsers(dest="cmd", required=True)

    p_list = sub.add_parser("list-ids", help="List all people as '<id>.<generation>\t<name>'")
    p_list.add_argument("--file", required=True, help="Path to a familytree JSON (e.g. familytree/data/frank_peter.json)")
    p_list.set_defaults(func=cmd_list_ids)

    p_update = sub.add_parser("update-person", help="Update an existing person's data")
    p_update.add_argument("--file", required=True, help="Path to a familytree JSON")
    p_update.add_argument("--person-id", required=True, help="Person's id to update")
    p_update.add_argument(
        "--generation",
        type=int,
        default=None,
        help="Optional: disambiguate person by generation (needed if id repeats)",
    )
    p_update.add_argument("--name", default=None, help="Update name")
    p_update.add_argument("--gender", default=None, choices=["male", "female"], help="Update gender")
    p_update.add_argument("--birth-place", default=None, help="Update birth place")
    p_update.add_argument("--birth-date", default=None, help="Update birth date")
    p_update.add_argument("--death-place", default=None, help="Update death place")
    p_update.add_argument("--death-date", default=None, help="Update death date")
    p_update.add_argument("--marriage-place", default=None, help="Update marriage place")
    p_update.add_argument("--marriage-date", default=None, help="Update marriage date")
    p_update.add_argument("--religion", default=None, help="Update religion (reformatus|katolikus|evangelikus)")
    p_update.add_argument("--comment", default=None, help="Update comment")
    p_update.add_argument("--dry-run", action="store_true", help="Do not write file; print resulting JSON to stdout")
    p_update.add_argument("--no-backup", action="store_true", help="Do not create .bak-YYYYmmdd-HHMMSS backup")
    p_update.set_defaults(func=cmd_update_person)

    p_add = sub.add_parser("add-child", help="Append a new child under a parent node")
    p_add.add_argument("--file", required=True, help="Path to a familytree JSON")
    p_add.add_argument("--parent-id", required=True, help="Parent person's id")
    p_add.add_argument(
        "--parent-generation",
        type=int,
        default=None,
        help="Optional: disambiguate parent by generation (needed if id repeats)",
    )

    p_add.add_argument("--name", required=True, help="Child name")
    p_add.add_argument("--gender", required=True, choices=["male", "female"], help="Child gender")

    p_add.add_argument(
        "--id",
        default=None,
        help="Child id. If omitted, the tool auto-assigns max(id)+1 based on numeric ids.",
    )
    p_add.add_argument(
        "--preset",
        choices=["unknown", "private", "blank"],
        default="unknown",
        help="Default values for missing fields: unknown='?', private='private', blank=''",
    )

    p_add.add_argument("--religion", default="", help="reformatus|katolikus|evangelikus (optional)")
    p_add.add_argument("--birth-place", default=None)
    p_add.add_argument("--birth-date", default=None)
    p_add.add_argument("--death-place", default=None)
    p_add.add_argument("--death-date", default=None)
    p_add.add_argument("--marriage-place", default=None)
    p_add.add_argument("--marriage-date", default=None)
    p_add.add_argument("--comment", default="")

    p_add.add_argument("--dry-run", action="store_true", help="Do not write file; print resulting JSON to stdout")
    p_add.add_argument("--no-backup", action="store_true", help="Do not create .bak-YYYYmmdd-HHMMSS backup")
    p_add.add_argument(
        "--no-sync-siblings",
        action="store_true",
        help="Do not auto-refresh siblings among the parent's children after adding",
    )
    p_add.set_defaults(func=cmd_add_child)

    p_sync = sub.add_parser(
        "sync-siblings",
        help="Rebuild siblings lists among children of each parent (or a specific parent)",
    )
    p_sync.add_argument("--file", required=True, help="Path to a familytree JSON")
    p_sync.add_argument("--parent-id", default=None, help="Optional: only sync for this parent id")
    p_sync.add_argument(
        "--parent-generation",
        type=int,
        default=None,
        help="Optional: disambiguate the parent by generation",
    )
    p_sync.add_argument("--dry-run", action="store_true", help="Do not write file; print resulting JSON to stdout")
    p_sync.add_argument("--no-backup", action="store_true", help="Do not create .bak-YYYYmmdd-HHMMSS backup")
    p_sync.set_defaults(func=cmd_sync_siblings)

    return p



def main(argv: Optional[List[str]] = None) -> int:
    _ensure_utf8_stdio()
    if argv is None and len(sys.argv) == 1:
        # No CLI args: launch GUI
        gui_main()
        return 0
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except ToolError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
