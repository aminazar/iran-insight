select
    assoc.pid,
    assoc.bid,
    assoc.oid,
    mem.mid,
    mem.position_id,
    per.firstname_en as first_name_en,
    per.firstname_fa as first_name_fa,
    per.surname_en as sur_name_en,
    per.surname_fa as sur_name_fa,
    per.username as username,
    per.display_name_en,
    per.display_name_fa,
    biz.name as biz_name,
    biz.name_fa as biz_name_fa,
    biz.ceo_pid as biz_ceo_pid,
    biz.biz_type_id as biz_type_id,
    biz.address as biz_adress,
    biz.address_fa as biz_adress_fa,
    biz.tel as biz_tel,
    biz.url as biz_url,
    biz.general_stats as biz_general_stats,
    biz.financial_stats as biz_financial_stats,
    org.name org_name,
    org.name_fa as org_name_fa,
    org.ceo_pid as org_ceo_pid,
    org.org_type_id as org_type_id,
    pos.id as pos_id,
    pos.name as position_name,
    pos.name_fa as position_name_fa
from
    membership as mem
inner join
    association as assoc
on
    assoc.aid = mem.assoc_id
left outer join position_type as pos
on
    mem.position_id = pos.id
inner join person as per
on
    per.pid = assoc.pid

left outer join business as biz
on
    biz.bid = assoc.bid
left outer join organization as org
on
    org.oid = assoc.oid
where
    mem.is_representative = true
    and
    mem.is_active = false
order by assoc.pid
;
