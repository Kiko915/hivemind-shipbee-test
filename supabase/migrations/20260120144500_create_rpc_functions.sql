-- Remote Procedure Call (RPC) functions allow you to execute logic on the database side.
-- You can access them in your client using:
-- const { data, error } = await supabase.rpc('function_name', { param1: 'value' })

-- Example: Get ticket statistics (Uncomment to use)
/*
create or replace function get_ticket_counts(admin_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  total_open integer;
  total_urgent integer;
begin
  select count(*) into total_open from tickets where status = 'open';
  select count(*) into total_urgent from tickets where priority = 'urgent' and status = 'open';
  
  return json_build_object(
    'open', total_open,
    'urgent', total_urgent
  );
end;
$$;
*/

create or replace function get_dashboard_stats()
returns json
language plpgsql
security definer
as $$
declare
  total_tickets integer;
  active_users integer;
  open_count integer;
  resolved_count integer;
  closed_count integer;
  high_count integer;
  medium_count integer;
  low_count integer;
begin
  -- Get total tickets
  select count(*) into total_tickets from tickets;

  -- Get active users (customers)
  select count(*) into active_users from profiles where role = 'customer';

  -- Get status counts
  select count(*) into open_count from tickets where status = 'open';
  select count(*) into resolved_count from tickets where status = 'resolved';
  select count(*) into closed_count from tickets where status = 'closed';

  -- Get priority counts
  select count(*) into high_count from tickets where priority = 'high';
  select count(*) into medium_count from tickets where priority = 'medium';
  select count(*) into low_count from tickets where priority = 'low';

  return json_build_object(
    'total_tickets', total_tickets,
    'active_users', active_users,
    'status_counts', json_build_object(
      'open', open_count,
      'resolved', resolved_count,
      'closed', closed_count
    ),
    'priority_counts', json_build_object(
      'high', high_count,
      'medium', medium_count,
      'low', low_count
    )
  );
end;
$$;
