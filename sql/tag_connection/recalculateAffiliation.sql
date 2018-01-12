do $$
declare
    current_affinity int;
    related_tag_id int; -- related tag_id in each loop
    related_tag_name text; -- related tag_name in each loop

begin

  FOREACH related_tag_name IN ARRAY (select tags from ${tableName~} where ${condition^}) LOOP -- tableName: organization, business, product  condition: oid, bid , product_id = ...

  select tid into related_tag_id from tag where tag.name = related_tag_name;

  if((select count(*) from tag_connection where (tid1 = related_tag_id and tid2 = ${tid} ) or (tid1 = ${tid} and tid2 = related_tag_id)) > 0) then

      select affinity into current_affinity from tag_connection where (tid1 = related_tag_id and tid2 = ${tid} ) or (tid1 = ${tid} and tid2 = related_tag_id);

      if (${inc} != -1 or current_affinity != 0) then -- if increment (${inc}) is -1 and current affinity is zero it must be skipped
        UPDATE tag_connection SET affinity = current_affinity + ${inc} WHERE (tid1 = related_tag_id and tid2 = ${tid} ) or (tid1 = ${tid} and tid2 = related_tag_id);
      end if;

  else
      if (related_tag_id != ${tid}) then
        insert into tag_connection (tid1, tid2, affinity) values (${tid}, related_tag_id, ${default_affinity});
      end if;
  end if;

  end loop;

end $$;
