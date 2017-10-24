select
    assoc.pid,
    assoc.bid,
    assoc.oid,
    mem.mid,
    per.firstname_en as firstName_en,
    per.firstname_fa as firstName_fa,
    per.surname_en as surName_en,
    per.surname_fa as surName_fa,
    per.username as userName,
    per.display_name_en,
    per.display_name_fa,
    biz.name as bizName,
    biz.name_fa as bizName_fa,
    biz.ceo_pid as bizCeo_pid,
    biz.org_type_id as bizOrg_type_id,
    biz.address as bizAdress,
    biz.address_fa as bizAdress_fa,
    biz.tel as bizTel,
    biz.url as bizUrl,
    biz.general_stats as bizGeneral_stats,
    biz.financial_stats as bizFinancial_stats,
    org.name orgName,
    org.name_fa as orgName_fa,
    org.ceo_pid as orgCeo_pid,
    org.org_type_id as orgOrg_type_id
from
    membership as mem
inner join
    association as assoc
on
    assoc.aid = mem.assoc_id
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
