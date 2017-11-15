select
    partnership.*,
    p1.firstname_en as person1_firstname_en,
    p1.firstname_fa as person1_firstname_fa,
    p1.surname_en as person1_surname_en,
    p1.surname_fa as person1_surname_fa,
    p1.username as person1_username,
    p2.firstname_en as person2_firstname_en,
    p2.firstname_fa as person2_firstname_fa,
    p2.surname_en as person2_surname_en,
    p2.surname_fa as person2_surname_fa,
    p2.username as person2_username
from partnership
join person as p1 on partnership.pid1 = p1.pid
join person as p2 on partnership.pid2 = p2.pid
where partnership.id = ${id}