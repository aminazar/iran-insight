select 
	lce.*,
    lt.name as lce_name,
    lt.name_fa as lce_name_fa,
    lt.is_killer
from (
        select 
            temp.name as biz1_name,
            temp.name_fa as biz2_name_fa,
            b.name as biz2_name,
            b.name_fa as biz2_name_fa,
            temp.description,
            temp.description_fa,
            temp.start_date,
            temp.end_date,
            temp.lce_type_id,
            temp.is_confirmed

        from (
                select * from 
                business_lce as bl
                inner join business as b
                on bl.bid1 = b.bid
                where b.bid = ${bid}
             ) as temp
        left outer join  business as b
        on temp.bid2 = b.bid
) as lce
left outer join lce_type as lt
on lt.id = lce.lce_type_id;

    