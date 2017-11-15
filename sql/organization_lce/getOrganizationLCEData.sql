select
    organization_lce.*,
    former.oid as former_oid,
    former.name as former_name,
    former.name_fa as former_name_fa,
    seconder.oid as seconder_oid,
    seconder.name as seconder_name,
    seconder.name_fa as seconder_name_fa
from organization_lce
join organization as former on organization_lce.oid1 = former.oid
left outer join organization as seconder on organization_lce.oid2 = seconder.oid
where organization_lce.id = ${id}