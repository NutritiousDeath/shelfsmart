import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  console.log("getTeamMembers hit");

  const base44 = createClientFromRequest(req);

  try {
    const members = await base44.entities.TeamMember.list('-created_date', 200);
    console.log("TeamMembers fetched:", members?.length);

    return Response.json({
      success: true,
      users: (members || []).map(m => ({
        id: m.user_id || m.id,
        teamMemberId: m.id,
        user_id: m.user_id,
        full_name: m.full_name,
        email: m.email,
        role: m.role,
        department: m.department,
        sub_department: m.sub_department,
      }))
    });

  } catch (err) {
    console.error("getTeamMembers error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});