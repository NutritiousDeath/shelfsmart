import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  console.log("syncTeamMembers hit");

  const base44 = createClientFromRequest(req);

  try {
    const existing = await base44.entities.TeamMember.list('-created_date', 200);
    const existingUserIds = new Set((existing || []).map(m => m.user_id));

    const users = await base44.entities.User.list('-created_date', 200);
    console.log("Users found:", users?.length);

    let created = 0;
    let updated = 0;

    for (const u of (users || [])) {
      const existing = (await base44.entities.TeamMember.filter({ user_id: u.id }))?.[0];
      
      const data = {
        user_id: u.id,
        full_name: u.full_name || '',
        email: u.email || '',
        role: u.role || 'employee',
        department: u.department || '',
        sub_department: u.sub_department || '',
      };

      if (existing) {
        await base44.entities.TeamMember.update(existing.id, data);
        updated++;
      } else {
        await base44.entities.TeamMember.create(data);
        created++;
      }
    }

    return Response.json({ success: true, created, updated });

  } catch (err) {
    console.error("syncTeamMembers error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});