import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, UserPlus, Mail, Check, RefreshCw, Trash2, AlertTriangle, ChevronDown, UserMinus, Plus, Moon, Sun } from "lucide-react";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [canViewTeam, setCanViewTeam] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("employee");
  const [newMemberDepartment, setNewMemberDepartment] = useState("");
  const [newMemberSubDepartment, setNewMemberSubDepartment] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [openPicker, setOpenPicker] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    let me = null;
    try {
      me = await base44.auth.me();
      setCurrentUser(me);
      const allowed = ['admin', 'manager', 'store_director', 'assistant_store_director'];
      if (me && allowed.includes(me.role)) {
        setCanViewTeam(true);
      } else {
        setCanViewTeam(false);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Failed to load current user:", err.message);
      setLoading(false);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const res = await base44.functions.invoke("getTeamMembers", {});
      const result = res.data;
      if (result?.success) {
        setUsers(result.users || []);
      } else {
        throw new Error(result?.error || "Unknown error");
      }
    } catch (err) {
      console.log("Failed to load team members:", err.message);
      setLoadError("Couldn't load the full team list. Please try again.");
    }
    setLoading(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      setInviteSuccess(true);
      setInviteEmail("");
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      console.error("Invite error:", err.message);
    }
    setInviting(false);
  };

  // ─── KEY FIX: Only update TeamMember record, never User entity directly ─────
  // The previous code called base44.entities.User.update(userId, ...) where
  // userId = m.user_id from the TeamMember record. This fails because:
  // 1. Client-side User.update may not be permitted by Base44 permissions
  // 2. m.user_id !== the User entity's own id in some cases
  // Solution: always update the TeamMember record only (teamMemberId = m.id).
  // syncTeamMembers.ts will propagate changes to User records server-side.
  // ─────────────────────────────────────────────────────────────────────────────
  const updateRole = async (userId, newRole) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    // Must have a teamMemberId to update — if missing, cannot save
    if (!target.teamMemberId) {
      setSaveError("Cannot update role: TeamMember record not found. Try refreshing.");
      setTimeout(() => setSaveError(null), 4000);
      return;
    }

    setOpenPicker(null);
    setSavingUserId(userId);
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    try {
      // Only ever update the TeamMember record — this always works regardless
      // of whether the user is invited or manually added
      await base44.entities.TeamMember.update(target.teamMemberId, { role: newRole });
    } catch (err) {
      console.error("Update role error:", err.message);
      // Revert on failure
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: target.role } : u));
      setSaveError("Failed to save role change. Please try again.");
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSavingUserId(null);
    }
  };

  const updateDepartment = async (userId, field, value) => {
    const target = users.find(u => u.id === userId);
    if (!target || !target.teamMemberId) return;

    setOpenPicker(null);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));

    try {
      await base44.entities.TeamMember.update(target.teamMemberId, { [field]: value });
    } catch (err) {
      console.error("Update department error:", err.message);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: target[field] } : u));
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setAddingMember(true);
    try {
      const created = await base44.entities.TeamMember.create({
        user_id: "manual_" + Date.now(),
        email: newMemberEmail.trim(),
        full_name: newMemberName.trim() || newMemberEmail.trim(),
        role: newMemberRole,
        department: newMemberDepartment,
        sub_department: newMemberSubDepartment,
      });
      setUsers(prev => [...prev, {
        id: created.id,
        teamMemberId: created.id,
        email: newMemberEmail.trim(),
        full_name: newMemberName.trim() || newMemberEmail.trim(),
        role: newMemberRole,
        department: newMemberDepartment,
        sub_department: newMemberSubDepartment,
      }]);
      setNewMemberEmail(""); setNewMemberName(""); setNewMemberRole("employee");
      setNewMemberDepartment(""); setNewMemberSubDepartment("");
      setShowAddMember(false);
    } catch (err) {
      console.error("Add member error:", err.message);
    }
    setAddingMember(false);
  };

  const handleRemoveMember = async (member) => {
    if (!confirm("Remove " + (member.full_name || member.email) + " from the team?")) return;
    setRemovingMemberId(member.id);
    try {
      if (member.teamMemberId) {
        await base44.entities.TeamMember.delete(member.teamMemberId);
      } else {
        const members = await base44.entities.TeamMember.filter({ user_id: member.id });
        if (members && members[0]) {
          await base44.entities.TeamMember.delete(members[0].id);
        }
      }
      setUsers(prev => prev.filter(u => u.id !== member.id));
    } catch (err) {
      console.error("Remove member error:", err.message);
    }
    setRemovingMemberId(null);
  };

  const SUB_DEPARTMENTS = {
    deli: ["foh", "boh", "bakery", "cheese", "coffee"],
    grocery: ["bulk", "chill", "dairy", "frozen", "pet", "beer_wine"],
  };
  const DEPT_LABELS = { deli: "Deli", grocery: "Grocery", meat: "Meat", produce: "Produce", wellness: "Wellness" };
  const SUB_LABELS = { foh: "FOH", boh: "BOH", bakery: "Bakery", cheese: "Cheese", coffee: "Coffee", bulk: "Bulk", chill: "Chill", dairy: "Dairy", frozen: "Frozen", pet: "Pet", beer_wine: "Beer & Wine" };

  const ROLES = [
    { value: "employee", label: "Employee", style: "bg-slate-100 text-slate-700 border-slate-300" },
    { value: "manager", label: "Manager", style: "bg-amber-100 text-amber-700 border-amber-300" },
    { value: "store_director", label: "Store Director", style: "bg-purple-100 text-purple-700 border-purple-300" },
    { value: "assistant_store_director", label: "Asst. Store Director", style: "bg-blue-100 text-blue-700 border-blue-300" },
  ];
  const getRoleStyle = (role) => ROLES.find(r => r.value === role)?.style || "bg-slate-100 text-slate-600 border-slate-300";
  const getRoleLabel = (role) => ROLES.find(r => r.value === role)?.label || "Employee";

  const isProtectedRole = (role) => role === "store_director" || role === "assistant_store_director";
  const isManualMember = (u) => String(u.user_id || u.id || "").startsWith("manual_") || !u.user_id || String(u.user_id).startsWith("manual_");
  const canEditRole = (targetUser) => {
    if (!currentUser) return false;
    if (isManualMember(targetUser)) return true;
    if (currentUser.id === targetUser.id) return false;
    if (isProtectedRole(targetUser.role) && currentUser.role !== "admin") return false;
    return true;
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This cannot be undone. All your data will be deleted.")) return;
    setDeletingAccount(true);
    try {
      await base44.entities.User.delete(currentUser.id);
      base44.auth.logout();
    } catch (err) {
      console.error("Delete account error:", err.message);
      setDeletingAccount(false);
    }
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const inputClass = "w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300";

  const TapPicker = ({ pickerId, label, value, displayValue, options, onSelect, headerStyle }) => {
    const isOpen = openPicker === pickerId;
    return (
      <div className="flex-1">
        {label && <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpenPicker(isOpen ? null : pickerId); }}
          className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg border-2 text-sm font-medium active:opacity-75 ${headerStyle || "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200"}`}
        >
          <span className="truncate pr-2">{displayValue}</span>
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="mt-1 rounded-lg overflow-hidden shadow-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 z-20 relative">
            {options.map((opt, idx) => (
              <button
                key={opt.value + idx}
                type="button"
                onClick={(e) => { e.stopPropagation(); onSelect(opt.value); }}
                className={`w-full text-left px-4 py-3.5 text-sm font-medium border-b border-slate-100 dark:border-slate-700 last:border-0 active:bg-amber-50 dark:active:bg-amber-900/20 flex items-center gap-2
                  ${value === opt.value ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" : "text-slate-700 dark:text-slate-200"}`}
              >
                {value === opt.value
                  ? <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  : <span className="w-4 flex-shrink-0" />}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const availableRoles = (currentUser?.role === "admin")
    ? ROLES
    : ROLES.filter(r => r.value === "employee" || r.value === "manager");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl w-full" onClick={() => setOpenPicker(null)}>
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage users and access levels</p>
      </div>

      {/* Save error toast */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {saveError}
        </div>
      )}

      {/* Dark Mode */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Dark Mode</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{darkMode ? "Dark theme active" : "Light theme active"}</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-amber-400" : "bg-slate-200"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Invite User */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Invite User</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
          Sends an email invitation. The invited user will create their own account and receive full login access based on their role.
        </p>
        <form onSubmit={handleInvite} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
            <input
              type="email" required value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="employee@company.com"
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <TapPicker
            pickerId="invite-role"
            label="Role"
            value={inviteRole}
            displayValue={getRoleLabel(inviteRole)}
            options={ROLES.map(r => ({ value: r.value, label: r.label }))}
            onSelect={(val) => { setInviteRole(val); setOpenPicker(null); }}
            headerStyle={getRoleStyle(inviteRole)}
          />
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-medium text-slate-600 dark:text-slate-300">Access Levels:</p>
            <p>• <span className="font-medium text-purple-700">Store Director</span> — Full store oversight and admin access</p>
            <p>• <span className="font-medium text-blue-700">Asst. Store Director</span> — Full store oversight and admin access</p>
            <p>• <span className="font-medium text-amber-700">Manager</span> — Full access: inventory, orders, flash sales, settings, reports</p>
            <p>• <span className="font-medium text-slate-600">Employee</span> — Can view inventory, scan products, view flash sales</p>
          </div>
          {inviteSuccess && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-xl text-sm">
              <Check className="w-4 h-4" /> Invitation sent successfully!
            </div>
          )}
          <button type="submit" disabled={inviting}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {inviting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {inviting ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      </div>

      {/* Team Members */}
      {canViewTeam && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Team Members</h3>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowAddMember(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-bold rounded-lg">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
              <button onClick={loadData} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showAddMember && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleAddMember} className="space-y-2">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Add to Team Directory</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-2 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                  This adds someone to the team directory only. To give login access, use the Invite User section above.
                </p>
                <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Full Name" className={inputClass} />
                <input type="email" required value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="Email Address *" className={inputClass} />
                <TapPicker
                  pickerId="addmember-role"
                  label="Role"
                  value={newMemberRole}
                  displayValue={getRoleLabel(newMemberRole)}
                  options={ROLES.map(r => ({ value: r.value, label: r.label }))}
                  onSelect={(val) => { setNewMemberRole(val); setOpenPicker(null); }}
                  headerStyle={getRoleStyle(newMemberRole)}
                />
                <TapPicker
                  pickerId="addmember-dept"
                  label="Department"
                  value={newMemberDepartment}
                  displayValue={newMemberDepartment ? DEPT_LABELS[newMemberDepartment] : "— Department —"}
                  options={[{ value: "", label: "— None —" }, ...Object.entries(DEPT_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
                  onSelect={(val) => { setNewMemberDepartment(val); setNewMemberSubDepartment(""); setOpenPicker(null); }}
                />
                {SUB_DEPARTMENTS[newMemberDepartment] && (
                  <TapPicker
                    pickerId="addmember-subdept"
                    label="Sub-Department"
                    value={newMemberSubDepartment}
                    displayValue={newMemberSubDepartment ? SUB_LABELS[newMemberSubDepartment] : "— Sub-Department —"}
                    options={[{ value: "", label: "— None —" }, ...SUB_DEPARTMENTS[newMemberDepartment].map(s => ({ value: s, label: SUB_LABELS[s] }))]}
                    onSelect={(val) => { setNewMemberSubDepartment(val); setOpenPicker(null); }}
                  />
                )}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddMember(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                  <button type="submit" disabled={addingMember}
                    className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1">
                    {addingMember ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {addingMember ? "Adding..." : "Add to Directory"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-32" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-48" />
                  </div>
                </div>
              ))
            ) : loadError ? (
              <div className="py-10 text-center px-4 space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Couldn't load team members</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">{loadError}</p>
                <button onClick={loadData} className="text-xs px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-xl">Try Again</button>
              </div>
            ) : users.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">No users found</div>
            ) : (
              (showAll ? users : users.slice(0, 20)).map(u => (
                <div key={u.id} className="p-4 space-y-3" onClick={e => e.stopPropagation()}>
                  {/* Row 1: Avatar + Name/Email + Remove */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRoleStyle(u.role)}`}>
                      {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-slate-100 font-medium text-sm truncate">{u.full_name || "—"}</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs truncate">{u.email}</p>
                      {/* Show saving indicator per-user */}
                      {savingUserId === u.id && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                        </p>
                      )}
                    </div>
                    {currentUser?.id !== u.id && (
                      <button onClick={() => handleRemoveMember(u)} disabled={removingMemberId === u.id}
                        className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-lg flex-shrink-0">
                        {removingMemberId === u.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Row 2: Role picker */}
                  <div className="pl-12">
                    {canEditRole(u) ? (
                      <TapPicker
                        pickerId={`role-${u.id}`}
                        label="Role"
                        value={u.role || "employee"}
                        displayValue={getRoleLabel(u.role)}
                        options={availableRoles.map(r => ({ value: r.value, label: r.label }))}
                        onSelect={(val) => updateRole(u.id, val)}
                        headerStyle={getRoleStyle(u.role)}
                      />
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</p>
                        <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border-2 ${getRoleStyle(u.role)}`}>
                          {getRoleLabel(u.role)}{currentUser?.id === u.id ? " (you)" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Department + Sub-department pickers */}
                  <div className="pl-12 flex gap-2">
                    <TapPicker
                      pickerId={`dept-${u.id}`}
                      value={u.department || ""}
                      displayValue={u.department ? DEPT_LABELS[u.department] : "— Department —"}
                      options={[{ value: "", label: "— None —" }, ...Object.entries(DEPT_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
                      onSelect={(val) => updateDepartment(u.id, "department", val)}
                    />
                    {SUB_DEPARTMENTS[u.department] && (
                      <TapPicker
                        pickerId={`subdept-${u.id}`}
                        value={u.sub_department || ""}
                        displayValue={u.sub_department ? SUB_LABELS[u.sub_department] : "— Sub-Dept —"}
                        options={[{ value: "", label: "— None —" }, ...SUB_DEPARTMENTS[u.department].map(s => ({ value: s, label: SUB_LABELS[s] }))]}
                        onSelect={(val) => updateDepartment(u.id, "sub_department", val)}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
            {!loading && !loadError && users.length >= 20 && !showAll && (
              <div className="p-3 text-center">
                <button onClick={() => setShowAll(true)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 flex items-center gap-1 mx-auto">
                  <ChevronDown className="w-3.5 h-3.5" /> Show all {users.length} members
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 shadow-sm">
        <div className="p-5 border-b border-red-100 dark:border-red-900">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Danger Zone</h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Irreversible actions</p>
        </div>
        <div className="p-5">
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm select-none">
            <Trash2 className="w-4 h-4 inline mr-2" />Delete My Account
          </button>
          {showDeleteConfirm && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium mb-2">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium select-none">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deletingAccount}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 select-none">
                  {deletingAccount ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
