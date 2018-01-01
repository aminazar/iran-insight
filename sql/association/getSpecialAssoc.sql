select * from association
where (pid = ${pid} And bid = ${bid} and oid = null) or ( pid = ${pid} And oid = ${oid} and bid = null ) or (bid = ${bid} And oid = ${oid} and pid = null)