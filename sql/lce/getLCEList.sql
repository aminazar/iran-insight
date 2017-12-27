
	select
        count(*) over () as total,
  		second.*,
		lce_type.name as lce_type_name,
		lce_type.name_fa as lce_type_name_fa,
		lce_type.active
		from (
			select
			first.id,
			first.possessor_name,
			first.possessor_name_fa,
			joiner.name as joiner_name,
			joiner.name_fa as joiner_name_fa,
			first.start_date,
			first.end_date,
			first.is_confirmed,
			first.lce_type_id
			from (
					select
					possessor.name as possessor_name,
					possessor.name_fa as possessor_name_fa,
					temp.*
					from (
						select lce.* from
						${tableName~} as lce -- tableName: business_lce or organization_lce
						where lce.id1 = ${possessorId} or lce.id2 = ${possessorId}  and ${condition^} -- weather show all or confirmed or requested lce
					) as temp

					left outer join  ${possessorName~} as possessor -- possessorName: business or organization
					on temp.id1 = possessor.${possessorIdName~} ) as first -- possessorIdName: bid or oid

			left outer join ${possessorName~}  as joiner
			on first.id2 = joiner.${possessorIdName~} ) as second

		inner join lce_type
		on second.lce_type_id = lce_type.id

		order by is_confirmed limit ${limit} offset ${offset}


