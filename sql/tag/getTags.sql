select * from tag where name = any ((select tags from ${tableName~} where ${condition^})::text[]) ${activeCondition^};

