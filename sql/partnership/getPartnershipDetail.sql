select
    partnership.id,
    p1.pid as possessor_id,
    p2.pid as joiner_id,
    partnership.start_date,
    partnership.end_date,
    partnership.description,
    partnership.description_fa,
    partnership.is_confirmed,
    p1.display_name_en as possessor_display_name,
    p1.display_name_fa as possessor_display_name_fa,
    p2.display_name_en as joiner_display_name,
    p2.display_name_fa as joiner_display_name_fa
from partnership
join person as p1 on partnership.pid1 = p1.pid
join person as p2 on partnership.pid2 = p2.pid
where partnership.id = ${id}