select * from association
where (pid = ${pid} And bid = ${bid}) or ( pid = ${pid} And oid = ${oid}) or (bid = ${bid} And oid = ${oid})